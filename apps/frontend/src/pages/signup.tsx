import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth-store';

const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters.')
      .max(100, 'Name must be at most 100 characters.'),
    email: z.string().min(1, 'Email is required.').email('Please enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

interface PasswordChecklistProps {
  password: string;
}

const PasswordChecklist = ({ password }: PasswordChecklistProps) => {
  const checks = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'At least 1 uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'At least 1 number',
      met: /[0-9]/.test(password),
    },
    {
      label: 'At least 1 symbol',
      met: /[^a-zA-Z0-9]/.test(password),
    },
    {
      label: 'No 3+ sequential digits',
      met:
        password.length === 0 ||
        !/(?:012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/.test(password),
    },
    {
      label: 'No 3+ repeating characters',
      met: password.length === 0 || !/(.)\1{2,}/.test(password),
    },
  ];

  return (
    <ul className="mt-2 space-y-1">
      {checks.map((check) => (
        <li key={check.label} className="flex items-center gap-1.5 text-xs">
          {check.met ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          ) : (
            <X className="h-3.5 w-3.5 shrink-0 text-destructive" />
          )}
          <span className={check.met ? 'text-emerald-600' : 'text-muted-foreground'}>
            {check.label}
          </span>
        </li>
      ))}
    </ul>
  );
};

export const SignupPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const passwordValue = watch('password') ?? '';

  const onSubmit = async (data: SignupFormData): Promise<void> => {
    setIsLoading(true);
    setFormError(null);
    setIsDuplicateEmail(false);

    try {
      const response = await api.post('/auth/signup', {
        email: data.email,
        password: data.password,
        name: data.name,
      });
      useAuthStore.getState().setAuth(response.data.data.user, response.data.data.accessToken);
      void navigate('/dashboard', { replace: true });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response?.status === 'number' &&
        (error as { response: { status: number } }).response.status === 409
      ) {
        setIsDuplicateEmail(true);
        setFormError(null);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Join CClone LMS. It only takes a minute.
      </p>

      {isDuplicateEmail && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            An account with this email already exists.{' '}
            <Link to="/login" className="underline underline-offset-2 hover:text-foreground">
              Sign in instead?
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {formError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            autoFocus
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
          <PasswordChecklist password={passwordValue} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className="pr-10"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full min-h-[44px]"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};
