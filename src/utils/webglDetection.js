/**
 * WebGL Detection and Device Capability Utilities
 * Detects WebGL support and device performance capabilities
 */

/**
 * Check if WebGL is supported in the browser
 * @returns {boolean} True if WebGL is supported
 */
export function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

/**
 * Get WebGL capabilities and performance info
 * @returns {Object} WebGL capabilities
 */
export function getWebGLCapabilities() {
  if (!isWebGLSupported()) {
    return {
      supported: false,
      renderer: 'Unknown',
      vendor: 'Unknown',
      maxTextureSize: 0
    };
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    return {
      supported: true,
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
    };
  } catch (e) {
    return {
      supported: false,
      error: e.message
    };
  }
}

/**
 * Detect if device is mobile
 * @returns {boolean} True if mobile device
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Estimate device performance tier
 * @returns {string} 'low', 'medium', or 'high'
 */
export function getDevicePerformanceTier() {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 2;

  // Check memory (if available)
  const memory = navigator.deviceMemory || 4; // GB

  // Check if mobile
  const mobile = isMobileDevice();

  // Estimate tier
  if (mobile && (cores < 4 || memory < 3)) {
    return 'low';
  } else if (cores >= 8 && memory >= 8) {
    return 'high';
  } else {
    return 'medium';
  }
}

/**
 * Get recommended 3D quality settings based on device capabilities
 * @returns {Object} Recommended quality settings
 */
export function getRecommended3DQuality() {
  const tier = getDevicePerformanceTier();
  const mobile = isMobileDevice();

  const qualitySettings = {
    low: {
      atmosphereAltitude: 0.1,
      pointResolution: 4,
      arcResolution: 32,
      enableAntiAlias: false,
      maxPoints: 50
    },
    medium: {
      atmosphereAltitude: 0.15,
      pointResolution: 8,
      arcResolution: 64,
      enableAntiAlias: true,
      maxPoints: 100
    },
    high: {
      atmosphereAltitude: 0.2,
      pointResolution: 16,
      arcResolution: 128,
      enableAntiAlias: true,
      maxPoints: 200
    }
  };

  return {
    tier,
    mobile,
    settings: qualitySettings[tier]
  };
}

/**
 * Log WebGL info for debugging
 */
export function logWebGLInfo() {
  const capabilities = getWebGLCapabilities();
  const performanceTier = getDevicePerformanceTier();
  const mobile = isMobileDevice();

  console.log('🎮 WebGL Capabilities:');
  console.log('  Supported:', capabilities.supported);
  console.log('  Renderer:', capabilities.renderer);
  console.log('  Vendor:', capabilities.vendor);
  console.log('  Max Texture Size:', capabilities.maxTextureSize);
  console.log('📱 Device Info:');
  console.log('  Mobile:', mobile);
  console.log('  Performance Tier:', performanceTier);
  console.log('  CPU Cores:', navigator.hardwareConcurrency || 'Unknown');
  console.log('  Memory (GB):', navigator.deviceMemory || 'Unknown');
}
