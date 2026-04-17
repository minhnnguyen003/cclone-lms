import { GraduationCap } from 'lucide-react';
import { Outlet } from 'react-router';

import { Card, CardContent } from '@/components/ui/card';

export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-[400px]">
        <CardContent className="px-8 py-12">
          <div className="mb-6 text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-1 text-sm font-semibold">CClone LMS</p>
          </div>
          <Outlet />
        </CardContent>
      </Card>
    </div>
  );
};
