const fs = require('fs');
const path = require('path');

// Dossiers source (backend et web-client)
const sourceDirs = [
  path.join(__dirname, 'backend'),
  path.join(__dirname, 'web-client', 'src')
];

// Fichier de sortie
const outputFile = path.join(__dirname, 'dist', 'bundle.js');

// Fonction pour récupérer tous les fichiers .js récursivement
const getAllJsFiles = (dirs) => {
  let files = [];
  dirs.forEach((dir) => {
    fs.readdirSync(dir).forEach((file) => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        files = files.concat(getAllJsFiles([fullPath]));
      } else if (file.endsWith('.js')) {
        files.push(fullPath);
      }
    });
  });
  return files;
};

// Concaténer les fichiers
const concatFiles = () => {
  const jsFiles = getAllJsFiles(sourceDirs).filter(
    (file) => !file.includes('node_modules') // Exclure les fichiers dans node_modules
  );

  let concatenatedContent = '';

  jsFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    concatenatedContent += `\n// File: ${file}\n${content}\n`;
  });

  // Assurez-vous que le dossier de sortie existe
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, concatenatedContent, 'utf-8');
  console.log(`Tous les fichiers JavaScript ont été concaténés dans ${outputFile}`);
};

// Exécuter la concaténation
concatFiles();