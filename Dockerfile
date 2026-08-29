# Usamos a versão 24 do Node (versão Alpine é mais leve e rápida)
FROM node:24-alpine

# Criamos a pasta de trabalho dentro do container
WORKDIR /app

# Copiamos os arquivos de dependências primeiro (otimiza o cache do Docker)
COPY package*.json ./

# Instalamos as bibliotecas
RUN npm install

# Copiamos o resto do projeto
COPY . .

# Comando crucial para o Prisma gerar as tabelas no ambiente Linux do container
RUN npx prisma generate

# Avisamos que a API vai rodar na porta 3000
EXPOSE 3000

# O comando para ligar o servidor
# CMD ["node", "server.js"]
CMD ["npx", "tsx", "server.js"]