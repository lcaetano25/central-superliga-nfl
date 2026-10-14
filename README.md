# Central Superliga NFL

Página que se atualiza sozinha com os dados públicos do Sleeper.
Uma ação do GitHub busca os dados a cada 30 minutos e grava em `data/data.json`; a página (`index.html`) só lê esse arquivo.

## Publicar (uma vez)
1. Crie um repositório no GitHub (pode ser público) e envie todo o conteúdo desta pasta.
   A pasta `.github/workflows/` precisa existir: se o envio pelo navegador não levar pastas ocultas, use *Add file > Create new file*, digite `.github/workflows/update.yml` como nome e cole o conteúdo do arquivo.
2. **Settings > Pages**: *Deploy from a branch*, branch `main`, pasta `/ (root)`.
3. **Actions > Atualizar dados > Run workflow** para gerar os primeiros dados. Depois disso roda sozinha.
4. O endereço da página aparece em Settings > Pages.

## Adicionar outro time
Edite `config.json` e acrescente o usuário do Sleeper:
```json
{ "teams": [ { "username": "Lcaetano25", "leagues": [] }, { "username": "outro_usuario", "leagues": [] } ] }
```
`leagues` vazio traz todas as ligas de NFL da temporada; para limitar, coloque os `league_id`.
Com mais de um time/liga, a página mostra um seletor no topo.

## O que a página faz
- **Capa:** placar ao vivo, projeção dos titulares, chance de vitória (modelo próprio, mesma curva do Diário original), alertas de lesão e de bye.
- **Plantão:** manchetes de ESPN e CBS Sports (feeds RSS públicos) que citam jogadores do seu elenco ou do adversário, com link para a matéria.
- **Rodada:** titulares lado a lado, com adversário da NFL, projeção e bye; banco e IR.
- **Ferramentas:** Troca (regra dos 10%, com importação da "Lista Completa" da calculadora da Superliga: copie a tabela e cole na caixa), Confronto ao vivo, Pontos (usa a pontuação da liga), Titular ou banco e Checklist semanal. O que você digita fica só no seu navegador.
- **Ranking:** todos os times da Superliga ordenados por pontos feitos, com busca, sua posição geral e na sua liga. Usa o arquivo `SLPinicial2026.csv` da Superliga (liga e SLP inicial de cada usuário) e as ligas do Sleeper; a primeira execução leva mais tempo porque descobre o código de cada liga (guardado em `data/leagues.json`). Os nomes completos do arquivo não são copiados: só aparecem usuário e nome de time do Sleeper.
- **Liga** e **Regras** (calendário, byes do seu elenco, pontuação).

## Limites
- Projeção, calendário da NFL (bye e adversário) e o status dos jogadores vêm de endereços do Sleeper que **não estão na documentação oficial** e podem mudar sem aviso. Se falharem, a página continua funcionando sem esses campos.
- A projeção por jogador é recalculada com a pontuação da liga (ataque). Para kicker e defesa usa a pontuação padrão do Sleeper, que pode diferir da sua liga.
- Os feeds de notícia também são públicos, mas não oficialmente garantidos. Só manchete e link são guardados.
- Chance de vitória é um modelo (não o número do app) e só enxerga jogos já pontuados e projeções restantes.
- O ranking é por pontos feitos; a fórmula do "SLP Final" da Superliga não é pública, então a ordem pode diferir da do site. Os valores da calculadora de trocas não vêm de nenhuma API que eu tenha conseguido ler. Para automatizar, abra a página da Superliga no navegador, aperte F12, vá em Rede (Network) > Fetch/XHR, recarregue e copie o endereço da requisição que devolve os dados em JSON; com ele dá para incluir no script.
- O GitHub pode atrasar execuções agendadas. Para atualizar na hora, rode a ação manualmente.
- Status de lesão vem do cadastro de jogadores do Sleeper, que o script renova no máximo uma vez por dia.
- A API pública não traz projeção, chance de vitória, bye nem notícias; essas partes não existem nesta versão.
- Ranking geral da Superliga não está incluído.
