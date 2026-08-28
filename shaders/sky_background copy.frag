#version 330
in vec2 fragTexCoord;
out vec4 outputColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_cameraDir; // Passed from C++

// --- 3D NOISE & HASH UTILITIES ---
float hash31(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
}

vec3 hashGrad(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return normalize(-1.0 + 2.0 * fract(sin(p) * 43758.5453));
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    return mix(
        mix(mix(dot(hashGrad(i + vec3(0,0,0)), f - vec3(0,0,0)),
                dot(hashGrad(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
            mix(dot(hashGrad(i + vec3(0,1,0)), f - vec3(0,1,0)),
                dot(hashGrad(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
        mix(mix(dot(hashGrad(i + vec3(0,0,1)), f - vec3(0,0,1)),
                dot(hashGrad(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
            mix(dot(hashGrad(i + vec3(0,1,1)), f - vec3(0,1,1)),
                dot(hashGrad(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
}

float fbm(vec3 p) {
    float total = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
        total += amp * noise3D(p);
        p *= 2.02;
        amp *= 0.5;
    }
    return total;
}

// --- DEEP SPACE NEBULA ---
vec3 computeNebula(vec3 rayDir) {
    vec3 p = rayDir * 2.5 + vec3(0.0, u_time * 0.005, 0.0);
    vec3 q = vec3(fbm(p), fbm(p + vec3(5.2, 1.3, 2.8)), fbm(p + vec3(1.7, 9.2, 3.4)));
    float cloud = fbm(p + 1.8 * q);
    
    cloud = smoothstep(0.05, 0.60, cloud);
    
    vec3 colorCore = vec3(0.25, 0.05, 0.45);
    vec3 colorTeal = vec3(0.02, 0.30, 0.40);
    vec3 colorDust = vec3(0.70, 0.20, 0.10);

    vec3 neb = mix(colorCore, colorTeal, cloud);
    neb = mix(neb, colorDust, pow(cloud, 2.5));
    return neb * cloud * 1.5;
}

// --- DISTANT SPIRAL GALAXY ---
vec3 computeGalaxy(vec3 rayDir) {
    vec3 galaxyDir = normalize(vec3(0.65, 0.35, -0.68));
    float cosAngle = dot(rayDir, galaxyDir);
    
    if (cosAngle < 0.94) return vec3(0.0);
    
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(galaxyDir, up));
    vec3 localUp = cross(right, galaxyDir);
    
    vec2 gUV = vec2(dot(rayDir, right), dot(rayDir, localUp)) * 14.0;
    float r = length(gUV);
    float angle = atan(gUV.y, gUV.x);

    float spiral = sin(angle * 2.0 - log(r + 0.001) * 3.5);
    float core = exp(-r * 3.0) * 3.0;
    float arms = exp(-r * 1.0) * smoothstep(-0.2, 0.8, spiral);

    vec3 coreColor = vec3(1.0, 0.95, 0.8);
    vec3 armColor  = vec3(0.4, 0.6, 1.0);

    return (coreColor * core + armColor * arms * 0.8) * smoothstep(1.0, 0.0, r * 0.6);
}

// --- 3D STAR FIELD ---
float starField3D(vec3 rayDir, float scale, float threshold) {
    vec3 p = rayDir * scale;
    vec3 id = floor(p);
    vec3 gv = fract(p) - 0.5;

    float n = hash31(id);
    if (n > threshold) {
        float dist = length(gv);
        float size = (n - threshold) / (1.0 - threshold);
        float twinkle = sin(u_time * 2.5 + n * 6.28) * 0.35 + 0.65;
        return smoothstep(size * 0.4, 0.0, dist) * twinkle;
    }
    return 0.0;
}

void main() {
    // Safe camera direction fallback (prevents black screen if u_cameraDir is zero)
    vec3 forward = (length(u_cameraDir) < 0.001) ? vec3(0.0, 0.0, -1.0) : normalize(u_cameraDir);
    
    vec3 worldUp = (abs(forward.y) > 0.99) ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    vec3 right   = normalize(cross(forward, worldUp));
    vec3 up      = cross(right, forward);

    // Compute Ray Direction
    vec2 screenUV = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
    vec3 rayDir   = normalize(forward + screenUV.x * right + screenUV.y * up);

    // Base background color
    vec3 color = vec3(0.002, 0.002, 0.006);

    // Add Nebulae & Galaxy
    color += computeNebula(rayDir);
    color += computeGalaxy(rayDir);

    // Add Stars (Increased density threshold so stars are clearly visible)
    float majorStars = starField3D(rayDir, 50.0, 0.96);
    float microStars = starField3D(rayDir + vec3(17.1), 110.0, 0.97) * 0.6;

    vec3 starRGB = vec3(majorStars + microStars);
    vec3 tintedStars = mix(starRGB * vec3(0.8, 0.9, 1.0), starRGB * vec3(1.0, 0.85, 0.7), hash31(floor(rayDir * 50.0)));

    color += tintedStars * 1.5; // Boosted star intensity

    outputColor = vec4(color, 1.0);
}