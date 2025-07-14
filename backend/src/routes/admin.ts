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
    console.error('Admin middleware error:', error);
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
    console.error('Error fetching admin stats:', error);
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
      User.find({}, 'name email createdAt preferredLanguage dietaryRestrictions')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        users,
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        hasMore: skip + users.length < totalUsers
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
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
    console.error('Error promoting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Error promoting user to admin'
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
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Error deleting user'
    });
  }
});

export default router;