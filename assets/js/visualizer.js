/**
 * Thaprobaane International - Furniture Visualizer
 * Final Update: Colors, Textures + Reset Functionality
 */

const materials = [
    { id: 'm1', name: 'Royal Velvet', hex: '#002366', style: 'brightness(0.9) saturate(1.8)' },
    { id: 'm2', name: 'Classic Leather', hex: '#3d2b1f', style: 'contrast(1.4) brightness(0.6)' },
    { id: 'm3', name: 'Modern Linen', hex: '#B2BEB5', style: 'contrast(0.8) brightness(1.1)' },
    { id: 'm4', name: 'Mustard Velvet', hex: '#E1AD01', style: 'brightness(1.1) saturate(1.5)' },
    { id: 'm5', name: 'Emerald Silk', hex: '#046307', style: 'brightness(0.8) saturate(1.4)' },
    { id: 'm6', name: 'Charcoal Matte', hex: '#2c2c2c', style: 'grayscale(1) brightness(0.4)' }
];

document.addEventListener('DOMContentLoaded', () => {
    const sofaDisplay = document.getElementById('base-sofa');
    const bodyContainer = document.getElementById('body-colors');
    const cushionContainer = document.getElementById('cushion-colors');

    // සෝෆා එක පෙන්වීම
    if (sofaDisplay) {
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

    // Reset Button එකට වැඩේ සෙට් කිරීම
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetVisualizer);
    }
});

function createColorButton(mat, section) {
    const btn = document.createElement('button');
    btn.className = 'w-full aspect-square rounded-xl border-2 border-white/10 hover:border-blue-500 transition-all flex flex-col items-center justify-center p-1 bg-slate-800/40 group overflow-hidden';
    
    btn.innerHTML = `
        <div class="w-full h-full rounded-lg shadow-inner mb-1" style="background-color: ${mat.hex}"></div>
        <span class="text-[9px] text-gray-400 group-hover:text-white truncate w-full text-center px-1">${mat.name}</span>
    `;
    
    btn.onclick = () => {
        const sofa = document.getElementById('base-sofa');
        if (sofa) {
            sofa.style.filter = mat.style;
        }
    };
    return btn;
}

// Reset Function එක
function resetVisualizer() {
    const sofa = document.getElementById('base-sofa');
    if (sofa) {
        sofa.style.filter = 'none'; // ඔක්කොම ෆිල්ටර් අයින් කරනවා
        console.log("Visualizer Reset to Default");
    }
}