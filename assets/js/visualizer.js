/**
 * Thaprobaane International - Ultra Fast & Easy Visualizer
 * No Tokens | No Permissions | Just Works!
 */

const materials = [
    { id: 'm1', name: 'Royal Velvet', hex: '#002366' },
    { id: 'm2', name: 'Classic Leather', hex: '#3d2b1f' },
    { id: 'm3', name: 'Modern Linen', hex: '#B2BEB5' },
    { id: 'm4', name: 'Mustard Velvet', hex: '#E1AD01' },
    { id: 'm5', name: 'Emerald Silk', hex: '#046307' },
    { id: 'm6', name: 'Charcoal Matte', hex: '#2c2c2c' }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Imgur Block එක Bypass කරනවා (weserv proxy එකෙන්)
    const bodyImg = document.getElementById('layer-body');
    const cushionImg = document.getElementById('layer-cushions');
    if(bodyImg) bodyImg.src = "https://images.weserv.nl/?url=i.imgur.com/vhqVp90.png";
    if(cushionImg) cushionImg.src = "https://images.weserv.nl/?url=i.imgur.com/KzU5X3X.png";

    // 2. Color Buttons Create කරනවා
    const bodyContainer = document.getElementById('body-colors');
    const cushionContainer = document.getElementById('cushion-colors');
    if (bodyContainer && cushionContainer) {
        materials.forEach(mat => {
            bodyContainer.appendChild(createColorButton(mat, 'body'));
            cushionContainer.appendChild(createColorButton(mat, 'cushion'));
        });
    }

    document.getElementById('reset-btn').onclick = () => {
        document.getElementById('layer-body').style.backgroundColor = 'transparent';
        document.getElementById('layer-cushions').style.backgroundColor = 'transparent';
    };

    document.getElementById('ai-upload').onchange = (e) => {
        if (e.target.files.length > 0) document.getElementById('upload-label').innerText = e.target.files[0].name;
    };

    document.getElementById('ai-generate-btn').onclick = generateAIRemaster;
});

function createColorButton(mat, section) {
    const btn = document.createElement('button');
    btn.className = 'w-full aspect-square rounded-xl border-2 border-white/10 hover:border-blue-500 transition-all flex flex-col items-center justify-center p-1 bg-slate-800/40 group';
    btn.innerHTML = `<div class="w-full h-full rounded-lg mb-1" style="background-color: ${mat.hex}"></div><span class="text-[8px] text-gray-500 group-hover:text-white uppercase font-bold">${mat.name.split(' ')[0]}</span>`;
    btn.onclick = () => {
        const targetId = section === 'body' ? 'layer-body' : 'layer-cushions';
        document.getElementById(targetId).style.backgroundColor = mat.hex;
    };
    return btn;
}

async function generateAIRemaster() {
    const uploadInput = document.getElementById('ai-upload');
    const selectedMat = document.getElementById('ai-material').value;
    const modal = document.getElementById('ai-modal');
    const outputImg = document.getElementById('ai-output-img');
    const loader = document.getElementById('ai-loader');

    if (uploadInput.files.length === 0) return alert("Photo එකක් upload කරලා ඉඳපන් මචං!");

    modal.classList.remove('hidden');
    outputImg.classList.add('hidden');
    loader.classList.remove('hidden');

    // 3. කිසිම Token එකක් නැතිව Pollinations Turbo පාවිච්චි කරනවා
    const seed = Math.floor(Math.random() * 1000000);
    const prompt = `A luxury sofa in ${selectedMat} fabric, professional interior design showroom, cinematic lighting, photorealistic.`;
    const url = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1080&height=720&seed=${seed}&model=turbo&nologo=true`;

    const img = new Image();
    img.src = url;
    img.onload = () => {
        outputImg.src = url;
        loader.classList.add('hidden');
        outputImg.classList.remove('hidden');
        outputImg.style.opacity = '1';
        
        document.getElementById('download-ai-btn').onclick = () => {
            const link = document.createElement('a');
            link.href = url;
            link.download = `Thaprobaane_AI.jpg`;
            link.click();
        };
    };
    img.onerror = () => generateAIRemaster(); // Error ආවොත් auto-retry
}

window.closeAIModal = () => document.getElementById('ai-modal').classList.add('hidden');