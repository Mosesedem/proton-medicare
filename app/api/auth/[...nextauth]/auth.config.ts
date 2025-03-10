// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import GoogleProvider from "next-auth/providers/google";
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";
// import type { NextAuthOptions } from "next-auth";

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       name?: string | null;
//       email?: string | null;
//       image?: string | null;
//       firstName?: string;
//       //       phoneNumber?: string;
//       lastName?: string;
//       isVerified?: boolean;
//       role?: string;
//     };
//     accessToken?: string;
//   }
//   interface User {
//     isVerified?: boolean;
//     firstName?: string;
//     lastName?: string;
//     phoneNumber?: string;
//   }
// }

// const prisma = new PrismaClient();

// export const authOptions: NextAuthOptions = {
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         identifier: {
//           label: "Email or Phone",
//           type: "text",
//           placeholder: "email@example.com or phone number",
//         },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.identifier || !credentials?.password) {
//           return null;
//         }
//         // Check if identifier is email or phone
//         //         const isEmail = credentials.identifier.includes("@");

//         try {
//           // Find user by email or phone
//           const user = await prisma.user.findFirst({
//             where: {
//               OR: [
//                 { email: credentials.identifier },
//                 { phoneNumber: credentials.identifier },
//               ],
//             },
//           });

//           // If no user found or password doesn't match
//           if (!user || !user.password) {
//             throw new Error("Invalid email/phone or password");
//           }

//           const passwordValid = await bcrypt.compare(
//             credentials.password,
//             user.password
//           );
//           if (!passwordValid) {
//             throw new Error("Invalid email/phone or password");
//           }

//           // If user is not verified
//           if (!user.isVerified) {
//             throw new Error("Please verify your email address");
//           }

//           return {
//             id: user.id,
//             email: user.email || undefined,
//             name: `${user.firstName} ${user.lastName}`,
//             firstName: user.firstName || undefined,
//             lastName: user.lastName || undefined,
//             phoneNumber: user.phoneNumber || undefined,
//             isVerified: user.isVerified,
//           };
//         } catch (error: any) {
//           console.error("Authentication error:", error);
//           throw new Error(error.message || "Authentication failed");
//         }
//       },
//     }),
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID || "",
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
//       profile(profile) {
//         return {
//           id: profile.sub,
//           name: profile.name,
//           email: profile.email,
//           image: profile.picture,
//           firstName: profile.given_name,
//           lastName: profile.family_name,
//           isVerified: true,
//         };
//       },
//     }),
//   ],
//   pages: {
//     signIn: "/auth/signin",
//     error: "/auth/error",
//     verifyRequest: "/auth/verify-request",
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.firstName = user.firstName;
//         token.lastName = user.lastName;
//         token.phoneNumber = user.phoneNumber;
//         token.isVerified = user.isVerified;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user && token) {
//         session.user.id = token.id as string;
//         session.user.firstName = token.firstName as string;
//         session.user.lastName = token.lastName as string;
//         //         session.user.phoneNumber = token.phoneNumber as string;
//         session.user.isVerified = token.isVerified as boolean;
//       }
//       return session;
//     },
//   },
//   session: {
//     strategy: "jwt",
//     maxAge: 7 * 24 * 60 * 60, // 7 days
//   },
//   //   cookies: {
//   //     sessionToken: {
//   //       name: "auth_token",
//   //       options: {
//   //         httpOnly: true,
//   //         sameSite: "lax",
//   //         path: "/",
//   //         secure: process.env.NODE_ENV === "production",
//   //       },
//   //     },
//   //   },
//   secret: process.env.NEXTAUTH_SECRET,
//   debug: process.env.NODE_ENV === "development",
// };

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      firstName?: string;
      lastName?: string;
      isVerified?: boolean;
      role?: string;
    };
    accessToken?: string;
  }
  interface User {
    isVerified?: boolean;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    isVerified?: boolean;
  }
}

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: {
          label: "Email or Phone",
          type: "text",
          placeholder: "email@example.com or phone number",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }
        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.identifier },
                { phoneNumber: credentials.identifier },
              ],
            },
          });

          if (!user || !user.password) {
            throw new Error("Invalid email/phone or password");
          }

          const passwordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!passwordValid) {
            throw new Error("Invalid email/phone or password");
          }

          if (!user.isVerified) {
            throw new Error("Please verify your email address");
          }

          return {
            id: user.id,
            email: user.email || undefined,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            phoneNumber: user.phoneNumber || undefined,
            isVerified: user.isVerified,
          };
        } catch (error: any) {
          console.error("Authentication error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          firstName: profile.given_name,
          lastName: profile.family_name,
          isVerified: true,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT Callback:", { token, user });
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.phoneNumber = user.phoneNumber;
        token.isVerified = user.isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session Callback:", { session, token });
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        // session.user.phoneNumber = token.phoneNumber as string;
        session.user.isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
