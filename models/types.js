/**
 * @typedef {Object} ToneResult
 * @property {number} depth
 * @property {string} depthLabel
 * @property {string} undertone
 * @property {number} confidence
 * @property {Object} labMean
 * @property {number} labMean.l
 * @property {number} labMean.a
 * @property {number} labMean.b
 */

/**
 * @typedef {Object} Palette
 * @property {string} id
 * @property {string} undertone
 * @property {string} depthBucket
 * @property {Array<{name: string, hex: string, category: string}>} recommendedColors
 * @property {Object} makeupFamilies
 * @property {Array<{name: string, hex: string}>} makeupFamilies.blush
 * @property {Array<{name: string, hex: string}>} makeupFamilies.lipstick
 * @property {Array<{name: string, hex: string}>} makeupFamilies.eyeshadow
 * @property {Array<{name: string, hex: string}>} makeupFamilies.eyeliner
 */
