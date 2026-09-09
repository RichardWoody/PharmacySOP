import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

const DECLARATION_TEXT =
  'I confirm I have read, understood, and agree to adhere to this SOP.';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.user.staffId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!session.user.isActive) {
    return NextResponse.json(
      { error: 'Your staff account is not active' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const sopId = decodeURIComponent(id);
  if (!sopId) {
    return NextResponse.json({ error: 'Invalid SOP id' }, { status: 400 });
  }

  let declarationAccepted = false;
  try {
    const body = await request.json();
    declarationAccepted = Boolean(body?.declarationAccepted);
  } catch {
    // no body provided
  }

  if (!declarationAccepted) {
    return NextResponse.json(
      { error: 'You must accept the declaration before signing' },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const versionResult = await client.query(
      `SELECT id, version_number, status
         FROM sop_versions
        WHERE sop_id = $1
          AND status = 'active'
        ORDER BY effective_from DESC NULLS LAST, version_number DESC
        LIMIT 1`,
      [sopId]
    );

    const currentVersion = versionResult.rows[0];
    if (!currentVersion) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'No published version found for this SOP' },
        { status: 404 }
      );
    }

    const existingSignature = await client.query(
      `SELECT id, signed_at
         FROM staff_signatures
        WHERE sop_version_id = $1
          AND staff_user_id = $2
        LIMIT 1`,
      [currentVersion.id, session.user.staffId]
    );

    if (existingSignature.rows[0]) {
      await client.query('ROLLBACK');
      return NextResponse.json({
        message: 'This SOP version has already been signed',
        signedAt: existingSignature.rows[0].signed_at,
      });
    }

    const insertResult = await client.query(
      `INSERT INTO staff_signatures
         (sop_version_id, staff_user_id, role_at_signing, declaration_text, signed_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, signed_at`,
      [
        currentVersion.id,
        session.user.staffId,
        session.user.roleName ?? 'Unknown',
        DECLARATION_TEXT,
      ]
    );

    await client.query(
      `INSERT INTO audit_log (event_type, entity_type, entity_id, actor_email, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        'sop_signed',
        'sop_version',
        currentVersion.id,
        session.user.email,
        JSON.stringify({
          sopId,
          sopVersionId: currentVersion.id,
          versionNumber: currentVersion.version_number,
          staffUserId: session.user.staffId,
          roleAtSigning: session.user.roleName ?? 'Unknown',
        }),
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      message: 'SOP signed successfully',
      signatureId: insertResult.rows[0].id,
      signedAt: insertResult.rows[0].signed_at,
      versionNumber: currentVersion.version_number,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to sign SOP', error);
    return NextResponse.json(
      { error: 'Failed to record signature' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
