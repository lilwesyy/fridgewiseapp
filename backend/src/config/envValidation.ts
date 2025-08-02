interface RequiredEnvVar {
  name: string;
  description: string;
  validator?: (value: string) => boolean;
  defaultValue?: string;
}

interface OptionalEnvVar {
  name: string;
  description: string;
  defaultValue: string;
  validator?: (value: string) => boolean;
}

// Required environment variables that must be present
const REQUIRED_ENV_VARS: RequiredEnvVar[] = [
  {
    name: 'JWT_SECRET',
    description: 'Secret key for JWT token signing',
    validator: (value: string) => value.length >= 32 // JWT secret should be at least 32 characters
  },
  {
    name: 'MONGODB_URI',
    description: 'MongoDB connection string',
    validator: (value: string) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')
  }
];

// Optional environment variables with defaults
const OPTIONAL_ENV_VARS: OptionalEnvVar[] = [
  {
    name: 'NODE_ENV',
    description: 'Node.js environment',
    defaultValue: 'development',
    validator: (value: string) => ['development', 'production', 'test'].includes(value)
  },
  {
    name: 'PORT',
    description: 'Server port',
    defaultValue: '3001',
    validator: (value: string) => {
      const port = parseInt(value);
      return !isNaN(port) && port > 0 && port < 65536;
    }
  },
  {
    name: 'CORS_ORIGIN',
    description: 'CORS allowed origins (comma-separated)',
    defaultValue: 'http://localhost:3001,http://localhost:19006'
  },
  {
    name: 'REDIS_URL',
    description: 'Redis connection URL',
    defaultValue: 'redis://localhost:6379',
    validator: (value: string) => value.startsWith('redis://') || value.startsWith('rediss://')
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key for AI features',
    defaultValue: '',
    validator: (value: string) => !value || value.startsWith('sk-')
  },
  {
    name: 'CLOUDINARY_CLOUD_NAME',
    description: 'Cloudinary cloud name for image storage',
    defaultValue: ''
  },
  {
    name: 'CLOUDINARY_API_KEY',
    description: 'Cloudinary API key',
    defaultValue: ''
  },
  {
    name: 'CLOUDINARY_API_SECRET',
    description: 'Cloudinary API secret',
    defaultValue: ''
  },
  {
    name: 'EMAIL_HOST',
    description: 'SMTP email host',
    defaultValue: ''
  },
  {
    name: 'EMAIL_PORT',
    description: 'SMTP email port',
    defaultValue: '587',
    validator: (value: string) => {
      const port = parseInt(value);
      return !isNaN(port) && port > 0 && port < 65536;
    }
  },
  {
    name: 'EMAIL_USER',
    description: 'SMTP email username',
    defaultValue: ''
  },
  {
    name: 'EMAIL_PASSWORD',
    description: 'SMTP email password',
    defaultValue: ''
  },
  {
    name: 'CSP_REPORT_URI',
    description: 'Content Security Policy report URI',
    defaultValue: '',
    validator: (value: string) => !value || value.startsWith('http://') || value.startsWith('https://')
  },
  {
    name: 'FRONTEND_DOMAIN',
    description: 'Frontend domain for CSP',
    defaultValue: ''
  },
  {
    name: 'API_DOMAIN',
    description: 'API domain for CSP',
    defaultValue: ''
  },
  {
    name: 'ENABLE_QUERY_MONITORING',
    description: 'Enable database query performance monitoring',
    defaultValue: 'false',
    validator: (value: string) => ['true', 'false'].includes(value.toLowerCase())
  }
];

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    required: { present: number; total: number };
    optional: { withDefaults: number; total: number };
  };
}

export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  
  private constructor() {}
  
  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  public validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log('\n🔍 Validating environment variables...\n');

    // Validate required variables
    let requiredPresent = 0;
    for (const envVar of REQUIRED_ENV_VARS) {
      const value = process.env[envVar.name];
      
      if (!value) {
        errors.push(`❌ Missing required environment variable: ${envVar.name}`);
        console.log(`❌ ${envVar.name}: Missing (${envVar.description})`);
        continue;
      }
      
      // Validate value if validator provided
      if (envVar.validator && !envVar.validator(value)) {
        errors.push(`❌ Invalid value for ${envVar.name}: ${envVar.description}`);
        console.log(`❌ ${envVar.name}: Invalid value (${envVar.description})`);
        continue;
      }
      
      requiredPresent++;
      console.log(`✅ ${envVar.name}: OK (${envVar.description})`);
      
      // Special handling for sensitive variables
      if (envVar.name === 'JWT_SECRET') {
        if (value.length < 32) {
          warnings.push(`⚠️  JWT_SECRET is shorter than recommended 32 characters (current: ${value.length})`);
        }
        if (value === 'your-secret-key' || value === 'secret' || value === 'jwt-secret') {
          warnings.push(`⚠️  JWT_SECRET appears to be a default/weak value. Use a strong, unique secret.`);
        }
      }
    }

    console.log(''); // Empty line for readability

    // Validate and set defaults for optional variables
    let optionalWithDefaults = 0;
    for (const envVar of OPTIONAL_ENV_VARS) {
      const value = process.env[envVar.name];
      
      if (!value) {
        process.env[envVar.name] = envVar.defaultValue;
        optionalWithDefaults++;
        console.log(`📝 ${envVar.name}: Set to default "${envVar.defaultValue}" (${envVar.description})`);
        continue;
      }
      
      // Validate value if validator provided
      if (envVar.validator && !envVar.validator(value)) {
        warnings.push(`⚠️  Invalid value for ${envVar.name}: ${envVar.description}`);
        console.warn(`⚠️  ${envVar.name}: Invalid value, using default "${envVar.defaultValue}" (${envVar.description})`);
        process.env[envVar.name] = envVar.defaultValue;
        optionalWithDefaults++;
        continue;
      }
      
      console.log(`✅ ${envVar.name}: OK (${envVar.description})`);
    }

    // Print warnings
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.warn(warning));
    }

    const result: ValidationResult = {
      success: errors.length === 0,
      errors,
      warnings,
      summary: {
        required: { present: requiredPresent, total: REQUIRED_ENV_VARS.length },
        optional: { withDefaults: optionalWithDefaults, total: OPTIONAL_ENV_VARS.length }
      }
    };

    // Print summary
    console.log('\n📊 Environment Validation Summary:');
    console.log(`   Required variables: ${result.summary.required.present}/${result.summary.required.total} present`);
    console.log(`   Optional variables: ${result.summary.optional.total - result.summary.optional.withDefaults}/${result.summary.optional.total} configured, ${result.summary.optional.withDefaults} using defaults`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}\n`);

    return result;
  }

  public validateAndExit(): void {
    const result = this.validate();
    
    if (!result.success) {
      console.log('💥 Environment validation failed! Server cannot start safely.\n');
      console.log('📋 Required actions:');
      result.errors.forEach(error => console.log(`   ${error}`));
      console.log('\n💡 Create a .env file in the backend directory with the required variables.');
      console.log('📖 See README.md for environment variable documentation.\n');
      process.exit(1);
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️  Server starting with warnings. Consider reviewing the above issues.\n');
    } else {
      console.log('🎉 All environment variables validated successfully!\n');
    }
  }

  public getEnvInfo(): Record<string, any> {
    return {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
      jwtSecret: process.env.JWT_SECRET ? 'configured' : 'missing',
      redisUrl: process.env.REDIS_URL ? 'configured' : 'using default',
      openaiKey: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'missing',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'configured' : 'missing',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'configured' : 'missing'
      },
      email: {
        host: process.env.EMAIL_HOST ? 'configured' : 'missing',
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER ? 'configured' : 'missing',
        password: process.env.EMAIL_PASSWORD ? 'configured' : 'missing'
      },
      monitoring: {
        queryMonitoring: process.env.ENABLE_QUERY_MONITORING === 'true'
      }
    };
  }
}

// Export singleton instance
export const envValidator = EnvironmentValidator.getInstance();