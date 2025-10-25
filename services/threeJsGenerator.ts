import { ComprehensiveReport, Component } from '../types';

export const generateModelHtml = (report: ComprehensiveReport): string => {
    // Safely stringify components, providing an empty array as a fallback.
    const componentsJson = JSON.stringify(report.components || []);

    // Return a self-contained HTML string with Three.js and OrbitControls
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive 3D Model</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: #333; font-family: sans-serif; }
        canvas { display: block; }
        #info-panel {
            display: none;
            position: absolute;
            top: 15px;
            left: 15px;
            background: rgba(40, 40, 40, 0.85);
            color: #eee;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #555;
            max-width: 320px;
            max-height: calc(100vh - 30px);
            overflow-y: auto;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            transition: opacity 0.2s;
        }
        #info-panel h3 { margin: 0 0 10px 0; font-size: 1.2em; color: #61dafb; border-bottom: 1px solid #555; padding-bottom: 5px; }
        #info-panel strong { color: #88aaff; }
        #info-panel p, #info-panel ul { margin: 5px 0 10px 0; font-size: 0.9em; }
        #info-panel ul { padding-left: 20px; }
        #info-panel li { margin-bottom: 4px; }
        #info-close {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: #aaa;
            font-size: 1.5em;
            cursor: pointer;
            line-height: 1;
        }
        #info-close:hover { color: white; }
    </style>
</head>
<body>
    <div id="info-panel">
        <button id="info-close">&times;</button>
        <h3 id="info-name"></h3>
        <div id="info-details"></div>
    </div>
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>
    <script type="module">
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        // --- Data ---
        const componentsData = ${componentsJson};
        const componentMeshes = [];

        // --- Scene Setup ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x333333);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 150;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // --- Lighting ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight2.position.set(-5, -10, -7.5);
        scene.add(directionalLight2);

        // --- Controls ---
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // --- Helpers ---
        const gridHelper = new THREE.GridHelper(200, 50);
        scene.add(gridHelper);

        // --- Geometry Generation ---
        componentsData.forEach(component => {
            const dimensions = component.critical_dimensions || {};
            const length = dimensions.length?.nominal ?? 100;
            const od = dimensions.outer_diameter?.nominal ?? 50;
            const id = dimensions.inner_diameter?.nominal ?? 0;

            const shape = new THREE.Shape();
            const radius = od / 2;
            shape.absarc(0, 0, radius, 0, Math.PI * 2, false);

            if (id > 0) {
                const innerRadius = id / 2;
                const hole = new THREE.Path();
                hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
                shape.holes.push(hole);
            }
            
            const extrudeSettings = { depth: length, bevelEnabled: false };
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.center();

            const material = new THREE.MeshStandardMaterial({
                color: 0xcccccc, metalness: 0.8, roughness: 0.4
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData = { componentId: component.id };
            scene.add(mesh);
            componentMeshes.push(mesh);
        });

        // --- Interactivity ---
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const infoPanel = document.getElementById('info-panel');
        const infoName = document.getElementById('info-name');
        const infoDetails = document.getElementById('info-details');
        const infoClose = document.getElementById('info-close');
        let selectedObject = null;

        infoClose.addEventListener('click', () => { 
            infoPanel.style.display = 'none'; 
            if(selectedObject) {
                selectedObject.material.emissive.setHex(0x000000);
                selectedObject = null;
            }
        });
        
        function showInfoPanel(data) {
            infoName.textContent = data.name || 'Component Details';
            let detailsHtml = '';
            
            if (data.material) {
                detailsHtml += \`<p><strong>Material:</strong> \${data.material}</p>\`;
            }
            if (data.finish) {
                detailsHtml += \`<p><strong>Finish:</strong> \${data.finish}</p>\`;
            }

            if (data.critical_dimensions && Object.keys(data.critical_dimensions).length > 0) {
                detailsHtml += '<strong>Critical Dimensions:</strong><ul>';
                for (const [key, dim] of Object.entries(data.critical_dimensions)) {
                    detailsHtml += \`<li>\${key.replace(/_/g, ' ')}: \${dim.nominal || 'N/A'}\${dim.unit || ''} (\${dim.tolerance || 'N/A'})</li>\`;
                }
                detailsHtml += '</ul>';
            }

            if (data.gdt_callouts && data.gdt_callouts.length > 0) {
                detailsHtml += '<strong>GD&T Callouts:</strong><ul>';
                data.gdt_callouts.forEach(gdt => {
                    detailsHtml += \`<li>\${gdt.symbol || 'SYM'} \${gdt.tolerance || 'TOL'} | \${gdt.datum || 'DAT'} (\${gdt.feature || 'Feature'})</li>\`;
                });
                detailsHtml += '</ul>';
            }
            
            if (!detailsHtml) {
                detailsHtml = '<p>No detailed information available for this component.</p>';
            }

            infoDetails.innerHTML = detailsHtml;
            infoPanel.style.display = 'block';
        }
        
        function onMouseClick(event) {
            if (event.target !== renderer.domElement) return;

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(componentMeshes);
            
            // Reset previous selection
            if(selectedObject) {
                selectedObject.material.emissive.setHex(0x000000);
            }

            if (intersects.length > 0) {
                selectedObject = intersects[0].object;
                selectedObject.material.emissive.setHex(0x555555); // Highlight selected object
                
                const componentId = selectedObject.userData.componentId;
                const componentData = componentsData.find(c => c.id === componentId);
                if (componentData) showInfoPanel(componentData);

            } else {
                infoPanel.style.display = 'none';
                selectedObject = null;
            }
        }
        window.addEventListener('click', onMouseClick);
        
        // --- Animation Loop ---
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        
        // --- Resize Handler ---
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);

        animate();
    </script>
</body>
</html>
    `;
};
