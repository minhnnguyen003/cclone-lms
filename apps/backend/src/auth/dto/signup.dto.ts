import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Z]/, { message: 'Password must contain at least 1 uppercase letter.' })
  @Matches(/[0-9]/, { message: 'Password must contain at least 1 number.' })
  @Matches(/[^a-zA-Z0-9]/, { message: 'Password must contain at least 1 symbol.' })
  @Matches(/^(?!.*(?:012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210))/, {
    message: 'Password must not contain 3 or more sequential digits.',
  })
  @Matches(/^(?!.*(.)\1{2,})/, {
    message: 'Password must not contain 3 or more repeating characters.',
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}
