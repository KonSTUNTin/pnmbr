
window.onload = ()=>{
    const baseRadFactor = 0.0022; 
    const octaveSpeed = 0.007; 
    const plotRotationSpeed = -0.009; 
    const plotThickness = 0.3; 
    const wobblyConstant = 1.1; 
    const numPoints = 250; 
    const plotGap = 0.00017;

    const numPlots = 22; 
    const plots = []; 
    const maxTheta = 2 * Math.PI; 
    let baseRad = 1.7; 
    let coordinateCentrePoint = 850; 
    const amplitudeFactor = 1;
    let octaves = 1.1; 
    let noiseIntensityFactor = 1.8;
    let rotationAngle = 0;

    
    const extractViewBoxDimensions = () => {
        const svgElements = document.getElementById('ringPlots');
        let w = Math.min(window.innerHeight, window.innerWidth)
        const viewBoxWidth = 1000//svgElements.getBoundingClientRect().width;
        const viewBoxHeight = 1000//svgElements.getBoundingClientRect().height
        svgElements.style.top = (window.innerHeight - viewBoxHeight) / 2
        svgElements.style.left = (window.innerWidth - viewBoxWidth) / 2
        coordinateCentrePoint = Math.min(viewBoxWidth, viewBoxHeight) / 2;
    };

    // function to adjust the baseRad and noiseIntensityFactor if the viewbox is resized
    const adjustBaseRad = () => {
        baseRad = coordinateCentrePoint * baseRadFactor;
        noiseIntensityFactor = coordinateCentrePoint * 0.0014;
    };

    // Extract viewBox dimensions from SVG elements
    extractViewBoxDimensions();

    // adjust baseRad and noiseIntensityFactor values
    adjustBaseRad();

    // Initialize plots array
    for (let i = 0; i < numPlots; i++) {
        const path = document.getElementById(`plot${i + 1}`).children[0];
        const noiseIntensity = noiseIntensityFactor * (i / (numPlots - 1));
        const initialValue = i * plotGap; 
        plots.push({
        path,
        noiseIntensity,
        initialValue
        });
    }

    // Function to render a plot
    const renderPlot = (path, initialValue, noiseIntensity) => {
        let d = 'M';
        let innerD = '';
        // Iterate through points to create the plot
        for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * maxTheta;
        const thetaWithRotation = theta + rotationAngle; 
        const outerR = calculateR(thetaWithRotation, initialValue, noiseIntensity);
        const innerR = outerR - plotThickness;
        // Calculate outer coordinates
        const xOuter = coordinateCentrePoint + outerR * Math.cos(theta);
        const yOuter = coordinateCentrePoint + outerR * Math.sin(theta);
        d += `${xOuter},${yOuter} `;
        // Check if last point to close the outer ring
        if (i === numPoints) {
            d += ' ';
        }
        // Calculate inner coordinates
        const xInner = coordinateCentrePoint + innerR * Math.cos(theta);
        const yInner = coordinateCentrePoint + innerR * Math.sin(theta);
        innerD += `${xInner},${yInner} `;
        }
        // Combine outer and inner paths and close the path for the inner ring
        d += innerD + 'Z';
        path.setAttribute('d', d);
    };

    // This is a port of Ken Perlin's Java code.
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t, a, b) => a + t * (b - a);
    const grad = (hash, x, y, z) => {
        const h = hash & 15; // CONVERT LO 4 BITS OF HASH CODE
        const u = h < 8 ? x : y, // INTO 12 GRADIENT DIRECTIONS.
        v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    };
    const scale = n => Math.pow((1 + n) / 1.75, 3.5);
    const p = new Array(512);
    const permutation = [
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142,
        8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203,
        117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165,
        71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92,
        41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208,
        89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
        226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58,
        17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155,
        167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218,
        246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
        239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150,
        254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
    ];
    for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];
    const PerlinNoise = (x, y, z) => {
        const X = Math.floor(x) & 255, // FIND UNIT CUBE THAT
        Y = Math.floor(y) & 255, // CONTAINS POINT.
        Z = Math.floor(z) & 255;
        x -= Math.floor(x); // FIND RELATIVE X,Y,Z
        y -= Math.floor(y); // OF POINT IN CUBE.
        z -= Math.floor(z);
        const u = fade(x), // COMPUTE FADE CURVES
        v = fade(y), // FOR EACH OF X,Y,Z.
        w = fade(z);
        const A = p[X] + Y,
        AA = p[A] + Z,
        AB = p[A + 1] + Z, // HASH COORDINATES OF
        B = p[X + 1] + Y,
        BA = p[B] + Z,
        BB = p[B + 1] + Z; // THE 8 CUBE CORNERS,
        return scale(lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), // AND ADD
            grad(p[BA], x - 1, y, z), ), // BLENDED
            lerp(u, grad(p[AB], x, y - 1, z), // RESULTS
            grad(p[BB], x - 1, y - 1, z), ), ), // FROM  8
        lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), // CORNERS
            grad(p[BA + 1], x - 1, y, z - 1), ), // OF CUBE
            lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1)), ), ), );
    };

    // function to calculate outer radius using perlin noise
    const calculateR = (theta, initialValue, noiseIntensity) => {
        const r = initialValue + baseRad + noiseIntensity * PerlinNoise(wobblyConstant * Math.cos(theta), wobblyConstant * Math.sin(theta), octaves);
        return r * 300 + Math.pow(2, initialValue * amplitudeFactor); 
    };

    // Start the theta animation
    let lastFrameTime = 0;
    const animateTheta = () => {
        function updateTheta(currentTime) {
        // Calculate time since the last frame
        const deltaTime = currentTime - lastFrameTime;

        if (deltaTime >= 16.67) {
            plots.forEach(plot => {
            renderPlot(plot.path, plot.initialValue, plot.noiseIntensity);
            });
            octaves += octaveSpeed;
            // Increment rotation angle for clockwise rotation
            rotationAngle += plotRotationSpeed;
            lastFrameTime = currentTime;
        }
        // Request the next animation frame
        requestAnimationFrame(updateTheta);
        }
        // Start the animation
        requestAnimationFrame(updateTheta);
    };

    // Render all plots initially
    plots.forEach((plot, index) => renderPlot(plot.path, plot.initialValue, 0, 0, plot.noiseIntensity));

    // Start the theta animation
    animateTheta();
}