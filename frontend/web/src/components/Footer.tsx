import { IoRestaurant, IoMail, IoPhonePortrait, IoLogoTwitter } from 'react-icons/io5';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <IoRestaurant className="text-xl text-white" />
              </div>
              <span className="text-xl font-bold">FridgeWise</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Trasforma i tuoi ingredienti in ricette deliziose con l&apos;intelligenza artificiale. 
              Cucina meglio, spreca meno.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-300">
                <IoMail className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-300">
                <IoPhonePortrait className="text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-300">
                <IoLogoTwitter className="text-white" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Prodotto</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors duration-300">Funzionalità</a></li>
              <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors duration-300">Come funziona</a></li>
              <li><a href="#screenshots" className="text-gray-400 hover:text-white transition-colors duration-300">Screenshots</a></li>
              <li><a href="#download" className="text-gray-400 hover:text-white transition-colors duration-300">Download</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Supporto</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Centro Aiuto</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">FAQ</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Contattaci</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Feedback</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Legale</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Termini di Servizio</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Cookie Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Licenze</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-lg font-semibold mb-4">Resta aggiornato</h3>
            <p className="text-gray-400 mb-4">
              Ricevi le ultime novità e consigli di cucina direttamente nella tua inbox
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="La tua email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-600 focus:border-transparent focus:outline-none"
              />
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300">
                Iscriviti
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {currentYear} FridgeWise. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>🇮🇹 Italiano</span>
            <span>•</span>
            <span>Versione 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}