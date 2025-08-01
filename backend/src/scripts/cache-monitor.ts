#!/usr/bin/env npx ts-node

import dotenv from 'dotenv';
dotenv.config();

import { redisService } from '../services/redisService';
import { CacheService } from '../services/cacheService';
import { Recipe } from '../models/Recipe';
import { connectDB } from '../config/database';

interface CacheHealth {
  healthy: boolean;
  issues: string[];
  publicRecipes: {
    cached: number;
    database: number;
    match: boolean;
  };
}

async function checkCacheHealth(): Promise<CacheHealth> {
  const health: CacheHealth = {
    healthy: true,
    issues: [],
    publicRecipes: {
      cached: 0,
      database: 0,
      match: false
    }
  };

  try {
    // Check Redis connection
    if (!redisService.isHealthy()) {
      health.healthy = false;
      health.issues.push('Redis is not connected');
      return health;
    }

    // Check public recipes cache consistency
    const cachedRecipes = await CacheService.getPublicRecipes(1, 20, '', 'recent');
    const dbCount = await Recipe.countDocuments({
      isDeleted: { $ne: true },
      $or: [
        { dishPhotos: { $exists: true, $ne: [] } },
        { cookedAt: { $exists: true, $ne: null } }
      ]
    });

    health.publicRecipes.database = dbCount;
    health.publicRecipes.cached = cachedRecipes ? cachedRecipes.pagination?.total || 0 : 0;
    health.publicRecipes.match = health.publicRecipes.cached === health.publicRecipes.database;

    if (!health.publicRecipes.match) {
      health.healthy = false;
      health.issues.push(`Public recipes cache mismatch: cached=${health.publicRecipes.cached}, db=${health.publicRecipes.database}`);
    }

    // Check for stale cache (if cached recipes is 0 but db has recipes)
    if (health.publicRecipes.cached === 0 && health.publicRecipes.database > 0) {
      health.healthy = false;
      health.issues.push('Public recipes cache is empty but database has recipes');
    }

  } catch (error: any) {
    health.healthy = false;
    health.issues.push(`Cache health check failed: ${error.message}`);
  }

  return health;
}

async function fixCacheIssues(): Promise<void> {
  console.log('🔧 Attempting to fix cache issues...');
  
  try {
    // Clear public recipes cache
    await CacheService.invalidatePublicRecipesCache();
    console.log('✅ Cleared public recipes cache');
    
    // Warm cache with fresh data
    await CacheService.warmCache();
    console.log('✅ Cache warmed with fresh data');
    
  } catch (error: any) {
    console.log('❌ Failed to fix cache issues:', error.message);
  }
}

async function main() {
  try {
    await redisService.connect();
    await connectDB();
    
    console.log('🔍 Checking cache health...');
    const health = await checkCacheHealth();
    
    if (health.healthy) {
      console.log('✅ Cache is healthy!');
      console.log(`📊 Public recipes: ${health.publicRecipes.cached} cached, ${health.publicRecipes.database} in database`);
    } else {
      console.log('❌ Cache issues detected:');
      health.issues.forEach(issue => console.log(`  - ${issue}`));
      
      // Ask if user wants to fix issues
      const args = process.argv.slice(2);
      if (args.includes('--fix')) {
        await fixCacheIssues();
        
        // Re-check health
        console.log('\n🔍 Re-checking cache health...');
        const newHealth = await checkCacheHealth();
        if (newHealth.healthy) {
          console.log('✅ Cache issues fixed!');
        } else {
          console.log('❌ Some issues remain:');
          newHealth.issues.forEach(issue => console.log(`  - ${issue}`));
        }
      } else {
        console.log('\n💡 Run with --fix to automatically resolve issues');
      }
    }
    
  } catch (error: any) {
    console.log('💥 Cache monitor failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

export { checkCacheHealth, fixCacheIssues };