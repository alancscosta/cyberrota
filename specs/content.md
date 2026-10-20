# Especificação de conteúdo

Uma carta padrão contém id estável, tema, capítulo, dificuldade (1–3), tipo, enunciado, alternativas quando aplicável, resposta e explicação curta em linguagem adequada a estudantes iniciantes de Engenharia de Software.

As alternativas devem ser distintas e plausíveis. A explicação deve ensinar a ideia central mesmo quando a resposta estiver certa. O filtro por capítulo não pode incluir cartas de outros capítulos. Baralhos importados/editados são validados antes de começar uma partida.

## Esquema usado no protótipo

```json
{
  "id": "rede-001",
  "theme": "rede",
  "chapter": "Endereçamento IP",
  "difficulty": 1,
  "type": "mcq",
  "question": "Qual endereço é IPv4 privado?",
  "options": ["8.8.8.8", "192.168.1.10", "1.1.1.1", "203.0.113.4"],
  "answer": 1,
  "explanation": "192.168.0.0/16 é uma faixa privada, usada dentro de redes locais."
}
```
