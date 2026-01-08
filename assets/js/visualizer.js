/**
 * Thaprobaane International - Furniture Visualizer Logic
 */

const materials = [
    { id: 'm1', name: 'Royal Velvet', hex: '#002366' },
    { id: 'm2', name: 'Ash Linen', hex: '#B2BEB5' },
    { id: 'm3', name: 'Crimson Leather', hex: '#DC143C' },
    { id: 'm4', name: 'Mustard Velvet', hex: '#E1AD01' },
    { id: 'm5', name: 'Emerald Green', hex: '#046307' },
    { id: 'm6', name: 'Teak Wood', hex: '#8B4513' },
    { id: 'm7', name: 'Charcoal Black', hex: '#333333' },
    { id: 'm8', name: 'Cream White', hex: '#FFFDD0' }
];

document.addEventListener('DOMContentLoaded', () => {
    const sofaDisplay = document.getElementById('base-sofa');
    const bodyContainer = document.getElementById('body-colors');
    const cushionContainer = document.getElementById('cushion-colors');

    // සෝෆා පින්තූරය පෙන්වීම
    if (sofaDisplay) {
        // මේ ලින්ක් එක හරහා පින්තූරය ලෝඩ් වේ
        sofaDisplay.src = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1000"; 
        
        sofaDisplay.onload = () => {
            sofaDisplay.classList.remove('opacity-0');
            sofaDisplay.classList.add('opacity-100');
        };
    }

    // බටන්ස් නිර්මාණය
    if (bodyContainer && cushionContainer) {
        materials.forEach(mat => {
            bodyContainer.appendChild(createColorButton(mat, 'body'));
            cushionContainer.appendChild(createColorButton(mat, 'cushion'));
        });
    }
});

function createColorButton(mat, section) {
    const btn = document.createElement('button');
    btn.className = 'w-full aspect-square rounded-xl border-2 border-white/10 hover:border-blue-500 transition-all flex flex-col items-center justify-center p-1 group overflow-hidden bg-slate-800/30';
    
    btn.innerHTML = `
        <div class="w-full h-full rounded-lg shadow-md mb-1" style="background-color: ${mat.hex}"></div>
        <span class="text-[9px] text-gray-400 group-hover:text-white truncate w-full text-center px-1">${mat.name}</span>
    `;
    
    btn.onclick = () => {
        console.log(`Applying ${mat.name} to ${section}`);
    };
    
    return btn;
}