/**
 * PRODUCTION BUILD SCRIPT
 * Optimizes files for deployment
 */

const fs = require('fs');
const path = require('path');

class BuildScript {
  constructor() {
    this.sourceDir = './';
    this.buildDir = './dist';
    this.version = Date.now().toString();
  }
  
  async build() {
    console.log('🚀 Starting production build...');
    
    // Create build directory
    this.createBuildDirectory();
    
    // Copy and process files
    await this.processHTML();
    await this.processCSS();
    await this.processJS();
    await this.copyAssets();
    
    // Generate manifest
    this.generateManifest();
    
    console.log('✅ Build completed successfully!');
    console.log(`📦 Build output: ${this.buildDir}`);
  }
  
  createBuildDirectory() {
    if (fs.existsSync(this.buildDir)) {
      fs.rmSync(this.buildDir, { recursive: true });
    }
    fs.mkdirSync(this.buildDir, { recursive: true });
  }
  
  async processHTML() {
    console.log('📄 Processing HTML files...');
    
    const htmlContent = fs.readFileSync('index.html', 'utf8');
    
    // Add cache busting to asset references
    const processedHTML = htmlContent
      .replace(/href="css\/main\.css"/g, `href="css/main.css?v=${this.version}"`)
      .replace(/src="js\/([^"]+)"/g, `src="js/$1?v=${this.version}"`)
      .replace(/<title>.*<\/title>/, '<title>Cookbook Club RSVP</title>');
    
    fs.writeFileSync(path.join(this.buildDir, 'index.html'), processedHTML);
  }
  
  async processCSS() {
    console.log('🎨 Processing CSS files...');
    
    // Create CSS directory
    const cssDir = path.join(this.buildDir, 'css');
    fs.mkdirSync(cssDir, { recursive: true });
    
    // Read and minify CSS
    const cssContent = fs.readFileSync('css/main.css', 'utf8');
    const minifiedCSS = this.minifyCSS(cssContent);
    
    fs.writeFileSync(path.join(cssDir, 'main.css'), minifiedCSS);
  }
  
  async processJS() {
    console.log('⚡ Processing JavaScript files...');
    
    // Create JS directory
    const jsDir = path.join(this.buildDir, 'js');
    fs.mkdirSync(jsDir, { recursive: true });
    
    // Copy JS files (in production, you'd want proper minification)
    const jsFiles = [
      'js/config.js',
      'js/utils/utils.js',
      'js/utils/validation.js',
      'js/api.js',
      'js/components/form-handler.js',
      'js/components/user-selector.js',
      'js/components/recipe-picker.js',
      'js/components/menu-display.js',
      'js/components/ux-enhancements.js',
      'js/components/form-state.js',
      'js/components/real-time-sync.js',
      'js/components/menu-visualization.js',
      'js/main.js'
    ];
    
    // Create subdirectories
    fs.mkdirSync(path.join(jsDir, 'utils'), { recursive: true });
    fs.mkdirSync(path.join(jsDir, 'components'), { recursive: true });
    
    jsFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const minifiedContent = this.minifyJS(content);
        fs.writeFileSync(path.join(this.buildDir, file), minifiedContent);
      }
    });
  }
  
  async copyAssets() {
    console.log('📁 Copying assets...');
    
    // Copy any additional assets (images, fonts, etc.)
    const assetDirs = ['images', 'fonts', 'icons'];
    
    assetDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.copyDirectory(dir, path.join(this.buildDir, dir));
      }
    });
  }
  
  generateManifest() {
    const manifest = {
      version: this.version,
      buildTime: new Date().toISOString(),
      files: this.getFileList(this.buildDir)
    };
    
    fs.writeFileSync(
      path.join(this.buildDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }
  
  minifyCSS(css) {
    // Basic CSS minification
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
      .replace(/\s*{\s*/g, '{') // Clean up braces
      .replace(/}\s*/g, '}')
      .replace(/;\s*/g, ';')
      .trim();
  }
  
  minifyJS(js) {
    // Basic JS minification (in production, use a proper minifier)
    return js
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Clean up
      .trim();
  }
  
  copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    entries.forEach(entry => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
  
  getFileList(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.getFileList(filePath, fileList);
      } else {
        fileList.push(filePath.replace(this.buildDir + '/', ''));
      }
    });
    
    return fileList;
  }
}

// Run build if called directly
if (require.main === module) {
  const builder = new BuildScript();
  builder.build().catch(console.error);
}

module.exports = BuildScript;