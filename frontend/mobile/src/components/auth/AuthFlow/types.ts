export type AuthMode = 
  | 'welcome' 
  | 'login' 
  | 'register' 
  | 'forgot-password' 
  | 'verify-code' 
  | 'reset-password' 
  | 'verify-email';

export interface NotificationProps {
  visible: boolean;
  type: 'error' | 'success' | 'warning';
  title: string;
  message: string;
}

export interface AuthFlowComponentProps {
  onNotification: (notification: NotificationProps) => void;
  initialMode?: AuthMode;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  strength?: number;
}

export interface FormValidation {
  [key: string]: ValidationResult;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}