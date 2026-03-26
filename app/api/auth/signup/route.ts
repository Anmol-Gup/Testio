import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import { transporter } from '@/lib/nodemailer'
import { getAppUrl } from '@/lib/url'

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json()

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Create user using Admin client 
        // We set email_confirm: false to require verification
        const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false,
            user_metadata: { full_name: name }
        })

        if (authError) {
            // Check if user already exists
            if (authError.message.includes('already registered')) {
                return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 })
            }
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        const user = data.user;

        // 2. Hash password and Insert into public.users table
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { error: dbError } = await supabaseAdmin.from('users').insert([{
            id: user.id,
            email: email,
            password_hash: hashedPassword
        }]);

        if (dbError) {
            console.error('Failed to create public.users record:', dbError);
        }

        // 3. Generate a verification link using the Admin API
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email: email,
            password: password,
            options: {
                redirectTo: `${getAppUrl()}/login?verified=true`
            }
        });

        if (linkError) {
            console.error('Failed to generate verification link:', linkError);
            return NextResponse.json({ error: 'Failed to create verification link.' }, { status: 500 });
        }

        // 3. Send custom Verification email via Nodemailer
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@testio.io',
                to: email,
                subject: 'Verify your Testio account',
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; color: #09090b;">
                        <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em;">Welcome to Testio!</h2>
                        <p style="color: #71717a; line-height: 1.6; margin-bottom: 32px; font-size: 16px;">
                            Thanks for signing up, ${name}! To get started, please confirm your email address by clicking the button below. This ensures your account is secure.
                        </p>
                        <a href="${linkData.properties.action_link}" style="background: #8b5cf6; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; display: inline-block; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);">Confirm Email Address</a>
                        <p style="color: #71717a; font-size: 14px; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 24px; line-height: 1.5;">
                            If you didn't sign up for Testio, you can safely ignore this email.
                        </p>
                        <p style="color: #a1a1aa; font-size: 12px; margin-top: 16px;">
                            © ${new Date().getFullYear()} Testio. Built for indie founders.
                        </p>
                    </div>
                `,
            })
        } catch (mailErr) {
            console.error('Mail sending failed:', mailErr)
            // If mail fails here, the user is created but they can't verify easily.
            // In a real app, you might want to retry or inform the user.
        }

        return NextResponse.json({
            success: true,
            message: 'Account created! Please check your email to verify your account.'
        })
    } catch (err) {
        console.error('Signup error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
