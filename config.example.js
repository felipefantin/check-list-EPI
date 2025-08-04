module.exports = {
  // Servidor
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/checklist-epi',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui-mude-em-producao',

  // Upload de arquivos
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: process.env.MAX_FILE_SIZE || 5242880
}; 