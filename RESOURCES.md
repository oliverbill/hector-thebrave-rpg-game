# Tech Due Diligence Resources

## Knowledge

- [Repo: `oliverbill/tech-due-diligence-report` — design doc, eng review e `docs/pipeline-flow.html`](https://github.com/oliverbill/tech-due-diligence-report)
  A fonte primária do curso: a forma autoritativa da prática e do pipeline. Use para: qualquer dúvida sobre estágios, contratos de skill, tiers e lifecycle de engagement.
- [Repo: `GLOSSARY.md` do projeto](https://github.com/oliverbill/tech-due-diligence-report/blob/main/GLOSSARY.md)
  Glossário canônico dos termos do suite (ferramentas, conceitos de pipeline, lifecycle). Use para: nomenclatura — este workspace não duplica definições.
- [Guia: "The Ultimate Guide to Technical Due Diligence" — madewithlove](https://madewithlove.com/blog/the-ultimate-guide-to-technical-due-diligence/)
  O melhor guia público sobre a disciplina, escrito por uma consultoria que faz DD há anos (já usado como referência nos drafts de conteúdo do projeto). Use para: metodologia, o que avaliar além do código (pessoas, processo), como estruturar conclusões.
- [Docs: Semgrep — rules e semântica de matching](https://semgrep.dev/docs/)
  Documentação oficial. Use para: entender o que um match significa, limitações (intra-file, sem taint por padrão) e os packs `p/security-audit`.
- [Docs: Trivy — vulnerability scanning](https://trivy.dev/latest/docs/)
  Documentação oficial. Use para: como CVEs são associados a versões de dependências, freshness do DB, falsos positivos por lockfile.
- [Docs: Gitleaks](https://github.com/gitleaks/gitleaks)
  Documentação oficial. Use para: regex + entropia, por que achados são *candidatos* não confirmados (relevante pós-remoção do Trufflehog no rubric 0.32.0).

## Wisdom (Communities)

- [CTO Craft Community](https://ctocraft.com/community/)
  Comunidade de CTOs e líderes de engenharia com Slack ativo e alta moderação. Use para: validar interpretações de achados com quem senta do outro lado da mesa de DD.
- [Rands Leadership Slack](https://randsinrepose.com/welcome-to-rands-leadership-slack/)
  Comunidade grande e bem moderada de liderança em engenharia. Use para: perguntas sobre avaliação de equipes e maturidade de engenharia (o lado "people" do DD).

## Gaps

- Não existe livro canônico sobre Tech DD para investidores — o campo vive em guias de consultorias. Falta um recurso profundo sobre **defesa de relatório** (como responder ao pushback de um founder cujo codebase foi avaliado).
- Falta recurso confiável sobre precificação e escopo de engagements solo (o design doc do projeto é a melhor referência disponível por ora).
