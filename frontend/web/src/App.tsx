import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUpload } from './components/FileUpload';
import './App.css';
import './i18n';

type Screen = 'login' | 'upload' | 'ingredients' | 'recipe';

interface User {
  id: string;
  email: string;
  name?: string;
}

function App() {
  const { t, i18n } = useTranslation();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipe, setRecipe] = useState<any>(null);

  const [loginForm, setLoginForm] = useState({
    email: 'test@example.com',
    password: 'password123'
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.data.user);
      setToken(data.data.token);
      setCurrentScreen('upload');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleImageAnalyzed = (analyzedIngredients: any[]) => {
    setIngredients(analyzedIngredients);
    setCurrentScreen('ingredients');
  };

  const handleGenerateRecipe = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/recipe/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredients: ingredients.map(ing => ing.name),
          language: i18n.language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Recipe generation failed');
      }

      setRecipe(data.data);
      setCurrentScreen('recipe');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const renderLogin = () => (
    <div className="login-container">
      <h1>FridgeWiseAI</h1>
      <form onSubmit={handleLogin} className="login-form">
        <h2>{t('auth.signIn')}</h2>
        <div className="form-group">
          <label>{t('auth.email')}</label>
          <input
            type="email"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>{t('auth.password')}</label>
          <input
            type="password"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            required
          />
        </div>
        <button type="submit">{t('auth.signIn')}</button>
      </form>
    </div>
  );

  const renderIngredients = () => (
    <div className="ingredients-container">
      <h2>{t('camera.ingredients')}</h2>
      <div className="ingredients-list">
        {ingredients.map((ingredient, index) => (
          <div key={index} className="ingredient-item">
            <span>{ingredient.name}</span>
            <span className="confidence">{Math.round(ingredient.confidence * 100)}%</span>
          </div>
        ))}
      </div>
      <button onClick={handleGenerateRecipe} className="generate-button">
        {t('recipe.generateRecipe')}
      </button>
      <button onClick={() => setCurrentScreen('upload')} className="back-button">
        {t('common.back')}
      </button>
    </div>
  );

  const renderRecipe = () => (
    <div className="recipe-container">
      <h2>{recipe.title}</h2>
      <p>{recipe.description}</p>
      
      <div className="recipe-meta">
        <span>{t('recipe.cookingTime')}: {recipe.cookingTime} min</span>
        <span>{t('recipe.servings')}: {recipe.servings}</span>
        <span>{t('recipe.difficulty')}: {t(`recipe.difficulty.${recipe.difficulty}`)}</span>
      </div>

      <div className="recipe-section">
        <h3>{t('recipe.ingredients')}</h3>
        <ul>
          {recipe.ingredients.map((ingredient: any, index: number) => (
            <li key={index}>
              {ingredient.amount} {ingredient.unit} {ingredient.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="recipe-section">
        <h3>{t('recipe.instructions')}</h3>
        <ol>
          {recipe.instructions.map((instruction: string, index: number) => (
            <li key={index}>{instruction}</li>
          ))}
        </ol>
      </div>

      <button onClick={() => setCurrentScreen('upload')} className="back-button">
        {t('common.startOver')}
      </button>
    </div>
  );

  return (
    <div className="App">
      <div className="language-selector">
        <button 
          onClick={() => changeLanguage('en')}
          className={i18n.language === 'en' ? 'active' : ''}
        >
          EN
        </button>
        <button 
          onClick={() => changeLanguage('it')}
          className={i18n.language === 'it' ? 'active' : ''}
        >
          IT
        </button>
      </div>

      {!user && renderLogin()}
      {user && currentScreen === 'upload' && (
        <FileUpload 
          onImageAnalyzed={handleImageAnalyzed}
          token={token!}
        />
      )}
      {user && currentScreen === 'ingredients' && renderIngredients()}
      {user && currentScreen === 'recipe' && renderRecipe()}
    </div>
  );
}

export default App;
