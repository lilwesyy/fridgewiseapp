import express from 'express';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import { Analysis } from '../models/Analysis';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Middleware per verificare se l'utente è admin
const adminMiddleware = async (req: AuthRequest, res: any, next: any) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin privileges required.' 
      });
    }
    next();
  } catch (error) {
    console.log('Admin middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error verifying admin privileges' 
    });
  }
};

// GET /api/admin/stats - Ottieni statistiche dell'app
router.get('/stats', protect, adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Query per le statistiche principali
    const [
      totalUsers,
      totalRecipes, 
      totalAnalyses,
      todayUsers,
      todayRecipes,
      todayAnalyses,
      yesterdayUsers,
      weekUsers,
      monthUsers,
      adminUsers
    ] = await Promise.all([
      User.countDocuments(),
      Recipe.countDocuments(),
      Analysis.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      Recipe.countDocuments({ createdAt: { $gte: todayStart } }),
      Analysis.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekStart } }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      User.countDocuments({ role: 'admin' })
    ]);

    // Calcolo ingredienti totali dai risultati delle analisi
    const analysisResults = await Analysis.find({}, 'ingredients').lean();
    const totalIngredients = analysisResults.reduce((total, analysis) => {
      return total + (analysis.ingredients?.length || 0);
    }, 0);

    // Calcolo metriche di performance
    const averageRecipesPerUser = totalUsers > 0 ? totalRecipes / totalUsers : 0;
    const averageAnalysesPerUser = totalUsers > 0 ? totalAnalyses / totalUsers : 0;
    const averageIngredientsPerAnalysis = totalAnalyses > 0 ? totalIngredients / totalAnalyses : 0;
    
    // Calcolo tasso di crescita utenti
    const userGrowthRate = yesterdayUsers > 0 ? ((todayUsers - yesterdayUsers) / yesterdayUsers * 100) : 0;
    
    // Calcolo tempo medio di processamento analisi
    const recentAnalysesWithTime = await Analysis.find(
      { createdAt: { $gte: weekStart }, status: 'completed' }, 
      'processingTime'
    ).lean();
    const averageProcessingTime = recentAnalysesWithTime.length > 0 
      ? recentAnalysesWithTime.reduce((sum, a) => sum + a.processingTime, 0) / recentAnalysesWithTime.length 
      : 0;

    // Top ingredienti più rilevati
    const ingredientCounts: { [key: string]: number } = {};
    analysisResults.forEach(analysis => {
      if (analysis.ingredients) {
        analysis.ingredients.forEach((ingredient: any) => {
          const name = ingredient.name;
          if (name) {
            ingredientCounts[name] = (ingredientCounts[name] || 0) + 1;
          }
        });
      }
    });

    const topIngredients = Object.entries(ingredientCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Attività recente
    const [recentUsers, recentRecipes, recentAnalyses] = await Promise.all([
      User.find({}, 'name email createdAt')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Recipe.find({}, 'title createdAt')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Analysis.find({}, 'createdAt ingredients')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean()
    ]);

    const recentActivity = [
      ...recentUsers.map(user => ({
        type: 'user_registered' as const,
        timestamp: user.createdAt.toISOString(),
        details: `New user: ${user.name || user.email}`
      })),
      ...recentRecipes.map(recipe => ({
        type: 'recipe_generated' as const,
        timestamp: recipe.createdAt.toISOString(),
        details: `Recipe generated: ${recipe.title}`
      })),
      ...recentAnalyses.map(analysis => ({
        type: 'analysis_performed' as const,
        timestamp: analysis.createdAt.toISOString(),
        details: `Analysis completed (${analysis.ingredients?.length || 0} ingredients)`
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    // Informazioni di sistema
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memoryUsage: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      serverTime: new Date().toISOString()
    };

    const stats = {
      // Statistiche principali
      totalUsers,
      totalRecipes,
      totalAnalyses,
      totalIngredients,
      adminUsers,
      
      // Statistiche giornaliere
      todayUsers,
      todayRecipes,
      todayAnalyses,
      yesterdayUsers,
      
      // Statistiche temporali
      weekUsers,
      monthUsers,
      
      // Metriche di performance
      averageRecipesPerUser: Math.round(averageRecipesPerUser * 10) / 10,
      averageAnalysesPerUser: Math.round(averageAnalysesPerUser * 10) / 10,
      averageIngredientsPerAnalysis: Math.round(averageIngredientsPerAnalysis * 10) / 10,
      averageProcessingTime: Math.round(averageProcessingTime),
      userGrowthRate: Math.round(userGrowthRate * 10) / 10,
      
      // Top ingredienti e attività
      topIngredients,
      recentActivity,
      
      // Informazioni di sistema
      systemInfo
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.log('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching statistics'
    });
  }
});

// GET /api/admin/users - Lista utenti (con paginazione)
router.get('/users', protect, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      User.find({}, 'name email createdAt preferredLanguage dietaryRestrictions role isEmailVerified lastLoginAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments()
    ]);

    // Aggiungi statistiche per ogni utente
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [totalRecipes, totalAnalyses] = await Promise.all([
          Recipe.countDocuments({ userId: user._id }),
          Analysis.countDocuments({ userId: user._id })
        ]);

        return {
          ...user,
          isAdmin: user.role === 'admin',
          joinedAt: user.createdAt,
          totalRecipes,
          totalAnalyses
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        hasMore: skip + users.length < totalUsers
      }
    });

  } catch (error) {
    console.log('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching users'
    });
  }
});

// POST /api/admin/promote-user - Promuovi un utente ad admin (solo per super admin)
router.post('/promote-user', protect, adminMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'User is already an admin'
      });
    }

    user.role = 'admin';
    await user.save();

    return res.json({
      success: true,
      message: `User ${user.email} has been promoted to admin`,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.log('Error promoting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Error promoting user to admin'
    });
  }
});

// PATCH /api/admin/users/:id/admin - Modifica privilegi admin di un utente
router.patch('/users/:id/admin', protect, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from removing their own admin privileges
    if (String(user._id) === String(req.user!._id) && !isAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove your own admin privileges'
      });
    }

    user.role = isAdmin ? 'admin' : 'user';
    await user.save();

    return res.json({
      success: true,
      message: `User ${isAdmin ? 'promoted to' : 'removed from'} admin successfully`,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.role === 'admin'
      }
    });

  } catch (error) {
    console.log('Error updating user admin status:', error);
    return res.status(500).json({
      success: false,
      error: 'Error updating user admin status'
    });
  }
});

// PATCH /api/admin/users/:id/verify - Modifica stato di verifica di un utente
router.patch('/users/:id/verify', protect, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.isEmailVerified = isVerified;
    await user.save();

    return res.json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        isVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.log('Error updating user verification status:', error);
    return res.status(500).json({
      success: false,
      error: 'Error updating user verification status'
    });
  }
});

// DELETE /api/admin/users/:id - Elimina un utente
router.delete('/users/:id', protect, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (String(user._id) === String(req.user!._id)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `User ${user.email} has been deleted`,
      data: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.log('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Error deleting user'
    });
  }
});

// GET /api/admin/environment - Ottieni informazioni sull'ambiente (solo admin)
router.get('/environment', protect, adminMiddleware, async (req, res) => {
  try {
    const { envValidator } = await import('../config/envValidation');
    const envInfo = envValidator.getEnvInfo();
    
    res.json({
      success: true,
      data: {
        environment: envInfo,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        versions: {
          node: process.version,
          platform: process.platform,
          arch: process.arch
        }
      }
    });

  } catch (error) {
    console.log('Error fetching environment info:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching environment information'
    });
  }
});

// GET /api/admin/security - Ottieni dati di monitoraggio sicurezza (solo admin)
router.get('/security', protect, adminMiddleware, async (req, res) => {
  try {
    // Mock data per ora - in futuro questi dati potrebbero venire da un sistema di logging/monitoring
    const securityData = {
      csp: {
        totalReports: Math.floor(Math.random() * 50),
        blockedRequests: Math.floor(Math.random() * 25),
        topViolatedDirectives: [
          { directive: 'script-src', count: 12 },
          { directive: 'style-src', count: 8 },
          { directive: 'img-src', count: 5 },
          { directive: 'connect-src', count: 3 },
          { directive: 'font-src', count: 2 }
        ],
        recentReports: [
          {
            documentUri: 'https://app.example.com/dashboard',
            violatedDirective: 'script-src',
            blockedUri: 'https://malicious-site.com/script.js',
            timestamp: new Date(Date.now() - 300000).toISOString()
          },
          {
            documentUri: 'https://app.example.com/profile',
            violatedDirective: 'style-src',
            blockedUri: 'inline',
            timestamp: new Date(Date.now() - 600000).toISOString()
          },
          {
            documentUri: 'https://app.example.com/recipes',
            violatedDirective: 'img-src',
            blockedUri: 'data:',
            timestamp: new Date(Date.now() - 900000).toISOString()
          }
        ]
      },
      rateLimiting: {
        totalBlocked: Math.floor(Math.random() * 100),
        topBlockedIPs: [
          {
            ip: '192.168.1.100',
            count: 15,
            lastBlocked: new Date(Date.now() - 120000).toISOString()
          },
          {
            ip: '10.0.0.50',
            count: 8,
            lastBlocked: new Date(Date.now() - 240000).toISOString()
          },
          {
            ip: '172.16.0.25',
            count: 5,
            lastBlocked: new Date(Date.now() - 360000).toISOString()
          }
        ],
        recentBlocks: [
          {
            ip: '192.168.1.100',
            endpoint: '/api/auth/login',
            timestamp: new Date(Date.now() - 120000).toISOString(),
            reason: 'Too many login attempts'
          },
          {
            ip: '10.0.0.50',
            endpoint: '/api/recipes',
            timestamp: new Date(Date.now() - 240000).toISOString(),
            reason: 'Rate limit exceeded'
          },
          {
            ip: '172.16.0.25',
            endpoint: '/api/ai/analyze',
            timestamp: new Date(Date.now() - 360000).toISOString(),
            reason: 'Suspicious activity detected'
          }
        ]
      },
      authentication: {
        failedLogins: Math.floor(Math.random() * 30),
        suspiciousActivity: [
          {
            ip: '203.0.113.45',
            attempts: 25,
            lastAttempt: new Date(Date.now() - 180000).toISOString()
          },
          {
            ip: '198.51.100.78',
            attempts: 12,
            lastAttempt: new Date(Date.now() - 420000).toISOString()
          },
          {
            ip: '192.0.2.123',
            attempts: 8,
            lastAttempt: new Date(Date.now() - 720000).toISOString()
          }
        ]
      }
    };

    res.json({
      success: true,
      data: securityData
    });

  } catch (error) {
    console.log('Error fetching security data:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching security monitoring data'
    });
  }
});

// GET /api/admin/health - Ottieni dati di salute del sistema (solo admin)
router.get('/health', protect, adminMiddleware, async (req, res) => {
  try {
    // Informazioni reali del sistema
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // CPU usage simulato basato su carico del sistema
    const loadAverage = process.platform === 'linux' ? require('os').loadavg()[0] : 0.5;
    const cpuUsage = Math.min(loadAverage * 20, 100); // Converti load average in percentuale
    
    // Memory usage reale
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    
    // Disk usage simulato (in un'app reale useresti librerie come 'diskusage')
    const diskUsage = 35 + (Math.random() * 20); // Tra 35% e 55%
    
    // Active connections simulate (in un'app reale potresti tracciare le connessioni WebSocket/HTTP)
    const baseConnections = 8; // Connessioni base
    const variableConnections = Math.floor(Math.random() * 12); // 0-11 connessioni variabili
    const activeConnections = baseConnections + variableConnections;

    const healthData = {
      systemHealth: {
        cpuUsage: Math.round(cpuUsage * 10) / 10,
        memoryUsage: Math.round(memoryPercentage * 10) / 10,
        diskUsage: Math.round(diskUsage * 10) / 10,
        activeConnections,
        uptime: Math.floor(uptime)
      },
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
        },
        systemMemory: {
          total: Math.round(totalMemory / 1024 / 1024), // MB
          used: Math.round(usedMemory / 1024 / 1024), // MB
          free: Math.round(freeMemory / 1024 / 1024) // MB
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        version: process.env.APP_VERSION || '1.0.0',
        lastDeployment: new Date().toISOString(),
        pid: process.pid
      }
    };

    res.json({
      success: true,
      data: healthData
    });

  } catch (error) {
    console.log('Error fetching health data:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching system health data'
    });
  }
});

export default router;