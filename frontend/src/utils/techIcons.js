// Popüler teknolojiler için simge mapping
export const techIcons = {
    'react': '⚛️',
    'vue.js': '🟢',
    'vuejs': '🟢',
    'angular': '🅰️',
    'node.js': '🟢',
    'nodejs': '🟢',
    'python': '🐍',
    'javascript': '📜',
    'typescript': '📘',
    'java': '☕',
    'php': '🐘',
    'laravel': '🔴',
    'next.js': '▲',
    'nextjs': '▲',
    'express': '🚂',
    'django': '🎸',
    'flask': '🌶️',
    'spring': '🍃',
    'mysql': '🗄️',
    'postgresql': '🐘',
    'mongodb': '🍃',
    'redis': '⚡',
    'docker': '🐳',
    'kubernetes': '☸️',
    'aws': '☁️',
    'azure': '☁️',
    'gcp': '☁️',
    'firebase': '🔥',
    'graphql': '🔷',
    'rest-api': '🌐',
    'rest': '🌐',
    'tailwindcss': '💨',
    'bootstrap': '🎨',
    'sass': '💅',
    'css': '🎨',
    'html': '🌐',
    'git': '📦',
    'github': '🐙',
    'gitlab': '🦊',
    'flutter': '📱',
    'react-native': '📱',
    'swift': '🍎',
    'kotlin': '🟣',
    'android': '🤖',
    'ios': '🍎',
    'tensorflow': '🧠',
    'pytorch': '🔥',
    'ai-ml': '🤖',
    'blockchain': '⛓️',
    'ethereum': '💎',
    'bitcoin': '₿',
    'solana': '◎',
    'web3': '🌐',
    'nft': '🖼️',
    'defi': '💱'
};

// Teknoloji adını normalize et (küçük harf, boşlukları kaldır)
export const normalizeTechName = (name) => {
    if (!name) return '';
    return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/\./g, '');
};

// Teknoloji için simge getir
export const getTechIcon = (techName) => {
    const normalized = normalizeTechName(techName);
    return techIcons[normalized] || '💻'; // Varsayılan simge
};

