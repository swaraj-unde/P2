import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectToDB } from './db';
import { User } from '@/models/User.model';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Missing Email or Password');
                }
                try {
                    await connectToDB();
                    const user = await User.findOne({
                        email: credentials.email,
                    });

                    if (!user) {
                        throw new Error('User does not exist');
                    }

                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (isValid) {
                        throw new Error('Invalid Password');
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                    };
                } catch (err) {
                    console.error('Auth Error');
                    throw new Error(
                        'Some Problem Occured During Authorization'
                    );
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
};
