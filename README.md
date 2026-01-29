# DigiSac Boleto Flow

Sistema de automação para envio de boletos DigiSac + Omie com IA Gemini.

## Como subir no GitHub e Render:

1. Crie um novo repositório vazio no seu GitHub.
2. No seu computador, dentro da pasta do projeto, rode:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

3. No Render.com:
   - Clique em **New** > **Blueprint**.
   - Conecte seu repositório.
   - O Render lerá o arquivo `render.yaml` e criará o serviço.
   - **IMPORTANTE**: Vá em Dashboard > Seu Serviço > Environment e adicione a `API_KEY` do Gemini.