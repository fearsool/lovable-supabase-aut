

on:
  workflow_dispatch:

jobs:
  run-huggingface-script:
    runs-on: ubuntu-latest

    steps:
      - name: Kodları indir
        uses: actions/checkout@v2

      - name: Node.js ortamı kur
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Paketleri kur (axios)
        run: npm install axios

      - name: .env dosyasını yükle
        run: echo "HUGGINGFACE_API_TOKEN=${{ secrets.HUGGINGFACE_API_TOKEN }}" > .env

      - name: Görsel Üret
        run: node huggingfaceImageGen.js
