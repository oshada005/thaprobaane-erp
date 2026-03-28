/**
 * Thaprobaane International - AI Interior Designer
 * Now powered by Leonardo AI
 */

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ai-generate-btn').onclick = generateAIInterior;

    // File upload label updater
    const uploadInput = document.getElementById('ai-upload');
    if (uploadInput) {
        uploadInput.onchange = (e) => {
            if (e.target.files.length > 0) {
                document.getElementById('upload-label').innerHTML = `<span class="text-pink-400 break-all">${e.target.files[0].name}</span>`;
            } else {
                document.getElementById('upload-label').innerHTML = `Upload your room photo<br><span class="text-[9px] font-normal lowercase">(jpg, png, webp)</span>`;
            }
        };
    }

    // Fullscreen behavior
    document.getElementById('fullscreen-btn').onclick = () => {
        const img = document.getElementById('ai-output-img');
        if (img.src) {
            if (!document.fullscreenElement) {
                img.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }
    };

    // Toggle Room Type visibility based on Design Mode
    const taskTypeSelect = document.getElementById('task-type');
    const roomTypeSelect = document.getElementById('room-type');
    if (taskTypeSelect && roomTypeSelect) {
        const roomTypeContainer = roomTypeSelect.parentElement;
        taskTypeSelect.addEventListener('change', (e) => {
            const customDetailsInput = document.getElementById('custom-details');
            const interiorColorContainer = document.getElementById('interior-color-container');
            const furnitureColorContainer = document.getElementById('furniture-color-container');
            const fabricMaterialContainer = document.getElementById('fabric-material-container');

            if (e.target.value === 'furniture_repair') {
                roomTypeContainer.style.display = 'none';
                if (interiorColorContainer) interiorColorContainer.style.display = 'none';
                if (furnitureColorContainer) furnitureColorContainer.style.display = 'block';
                if (fabricMaterialContainer) fabricMaterialContainer.style.display = 'block';
                if (customDetailsInput) customDetailsInput.placeholder = "e.g. wooden legs, tufted back...";
            } else {
                roomTypeContainer.style.display = 'block';
                if (interiorColorContainer) interiorColorContainer.style.display = 'block';
                if (furnitureColorContainer) furnitureColorContainer.style.display = 'none';
                if (fabricMaterialContainer) fabricMaterialContainer.style.display = 'none';
                if (customDetailsInput) customDetailsInput.placeholder = "e.g. large windows, indoor plants, marble floor";
            }
        });
        // Trigger initial state
        taskTypeSelect.dispatchEvent(new Event('change'));
    }
});

async function generateAIInterior() {
    const roomType = document.getElementById('room-type').value;
    const interiorStyle = document.getElementById('interior-style').value;
    const colorPalette = document.getElementById('color-palette') ? document.getElementById('color-palette').value : '';
    const rgbColor = document.getElementById('furniture-color') ? document.getElementById('furniture-color').value : '#8b4513';
    const fabricMaterial = document.getElementById('fabric-material') ? document.getElementById('fabric-material').value : 'Premium Leather';
    const customDetails = document.getElementById('custom-details').value.trim();
    const uploadInput = document.getElementById('ai-upload');
    const taskType = document.getElementById('task-type') ? document.getElementById('task-type').value : 'interior';

    const outputImg = document.getElementById('ai-output-img');
    const loader = document.getElementById('ai-loader');
    const placeholder = document.getElementById('placeholder-state');
    const actionButtons = document.getElementById('action-buttons');
    const loaderText = loader.querySelector('p.animate-pulse');

    // UI Updates
    placeholder.classList.add('hidden');
    outputImg.classList.add('hidden');
    actionButtons.classList.add('hidden');
    loader.classList.remove('hidden');

    const apiKey = "c880656c-dd11-4d2a-84fd-6ae62efd8902";

    let prompt = "";
    if (taskType === 'furniture_repair') {
        prompt = `A stunning, brand new, fully restored and repaired piece of furniture. Flawless pristine condition, no tears, no scratches, no damage. Professionally reupholstered with ${fabricMaterial}, exact color code ${rgbColor}, precise tone matching hex ${rgbColor}, ${interiorStyle} style finish, studio lighting, 8k product photography.`;
    } else {
        prompt = `A breathtaking photorealistic interior design of a ${roomType}, ${interiorStyle} style, featuring a ${colorPalette} color palette, architectural digest 8k rendering, stunning cinematic lighting.`;
    }

    if (customDetails) {
        prompt += ` Includes ${customDetails}.`;
    }

    try {
        let initImageId = null;

        // Step 1: Handle Photo Upload (Image-to-Image) if provided
        if (uploadInput && uploadInput.files.length > 0) {
            const file = uploadInput.files[0];
            const extension = file.name.split('.').pop().toLowerCase();

            loaderText.innerText = "Uploading base photo to Leonardo...";

            let initRes;
            try {
                initRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/init-image', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'content-type': 'application/json',
                        'authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({ extension: extension })
                });
            } catch (e) {
                throw new Error("Init-Image Network Error: " + e.message + ". Check if your Adblocker is blocking Leonardo AI, or run this HTML on a local web server.");
            }

            if (!initRes.ok) throw new Error("Failed to get upload URL from Leonardo API. Status: " + initRes.status);

            const initData = await initRes.json();
            const presignedUrl = initData.uploadInitImage.url;
            initImageId = initData.uploadInitImage.id;
            const fields = JSON.parse(initData.uploadInitImage.fields);

            // Upload directly to S3
            const formData = new FormData();
            for (const key in fields) {
                formData.append(key, fields[key]);
            }
            formData.append('file', file);

            let uploadRes;
            try {
                // S3 strict CORS causes 'Failed to fetch' on local files.
                // We use mode: 'no-cors' to allow the browser to send the payload opaquely.
                uploadRes = await fetch(presignedUrl, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors'
                });
            } catch (e) {
                throw new Error("S3 Upload Network Error: " + e.message + ". Please try disabling your adblocker.");
            }

            // With no-cors, uploadRes.type is 'opaque' and ok is false, but the payload is delivered!

            loaderText.innerText = "Leonardo AI is rendering pixels...";
        }

        // Step 2: Request Generation
        const gRequest = {
            prompt: prompt,
            modelId: "5c232a9e-9061-4777-980a-ddc8e65647c6", // Vision XL
            num_images: 1,
            width: 1024,
            height: 768
        };

        if (taskType === 'furniture_repair') {
            gRequest.negative_prompt = "tears, holes, damage, scratched, cracked, peeling, ruined, old, dirty, broken, worn out";
        }

        if (initImageId) {
            // Include init Image specifics
            gRequest.init_image_id = initImageId;
            // Lower init_strength (e.g. 0.35) for furniture repair so it replaces the damage completely
            gRequest.init_strength = taskType === 'furniture_repair' ? 0.35 : 0.5;
        }

        let createRes;
        try {
            createRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'authorization': `Bearer ${apiKey}`,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(gRequest)
            });
        } catch (e) {
            throw new Error("Generations Network Error: " + e.message + ". Try turning off your adblocker or completely refreshing the page (Ctrl+F5).");
        }

        const createData = await createRes.json();
        if (!createData.sdGenerationJob || !createData.sdGenerationJob.generationId) {
            console.error("Leonardo API Error:", createData);
            throw new Error(createData.error || "Failed to start generation.");
        }

        const generationId = createData.sdGenerationJob.generationId;

        // Step 3: Poll for Result
        let imageUrl = null;
        let attempts = 0;

        while (!imageUrl && attempts < 25) { // wait up to 50 seconds
            await new Promise(r => setTimeout(r, 2000));

            let checkRes;
            try {
                checkRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                        'authorization': `Bearer ${apiKey}`
                    }
                });
            } catch (e) {
                throw new Error("Polling Network Error: " + e.message);
            }

            const checkData = await checkRes.json();
            const genDetails = checkData.generations_by_pk;

            if (genDetails && genDetails.status === 'COMPLETE') {
                if (genDetails.generated_images && genDetails.generated_images.length > 0) {
                    imageUrl = genDetails.generated_images[0].url;
                } else {
                    throw new Error("Image generated but URL not found in response.");
                }
            } else if (genDetails && genDetails.status === 'FAILED') {
                throw new Error("Generation failed on Leonardo AI.");
            }

            attempts++;
        }

        if (!imageUrl) {
            throw new Error("Generation timed out. Please try again.");
        }

        // Load the image securely
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            outputImg.src = imageUrl;
            loader.classList.add('hidden');
            outputImg.classList.remove('hidden');
            actionButtons.classList.remove('hidden');
            loaderText.innerText = "Leonardo AI is rendering pixels..."; // Reset text

            document.getElementById('download-ai-btn').onclick = () => {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `Thaprobaane_Leonardo_Interior.jpg`;
                link.target = '_blank';
                link.click();
            };
        };
        img.onerror = () => {
            throw new Error("Failed to load the generated image from Leonardo.");
        }
    } catch (err) {
        let errorMsg = err.message;

        // Catch the Leonardo token error specifically to make it friendly
        if (errorMsg.toLowerCase().includes('not enough api tokens')) {
            errorMsg = "Your Leonardo AI API Key has run out of tokens/credits! Please top up your Leonardo account or use a different API key.";
        }

        alert("Error generating image: " + errorMsg);

        loader.classList.add('hidden');
        placeholder.classList.remove('hidden');
        if (loaderText) loaderText.innerText = "Leonardo AI is rendering pixels...";
    }
}