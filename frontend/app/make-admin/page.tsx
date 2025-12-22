'use client';

import { useAuth } from '@/lib/auth-context';
import SetAdminRoleButton from '@/components/admin/set-admin-role';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function MakeAdminPage() {
  const { user } = useAuth();

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-10 w-10 text-purple-600" />
          </div>
          <CardTitle className="text-2xl text-center">Make Admin Account</CardTitle>
          <CardDescription className="text-center">
            Promote your current account to admin status
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="text-center mb-4">
            {user ? (
              <p>Logged in as: <span className="font-medium">{user.email}</span></p>
            ) : (
              <p>You must be logged in to use this feature</p>
            )}
          </div>
          <div className="flex justify-center">
            <SetAdminRoleButton />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-sm text-muted-foreground text-center mt-2">
            After becoming an admin, you'll have access to the <Link href="/admin" className="text-purple-600 hover:underline">admin dashboard</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}