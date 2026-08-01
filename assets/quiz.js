// Widget de quiz compartilhado. Uso numa lição:
//   <div class="quiz" data-quiz='[{"stem":"...","options":["a","b"],"answer":0,"why":"..."}]'></div>
//   <script src="../assets/quiz.js"></script>
// Feedback imediato por questão; placar ao final de todas.
(function () {
  document.querySelectorAll('.quiz[data-quiz]').forEach(function (root) {
    var questions;
    try { questions = JSON.parse(root.dataset.quiz); } catch (e) { return; }
    var answered = 0, right = 0;

    var score = document.createElement('p');
    score.className = 'score';

    questions.forEach(function (q, qi) {
      var box = document.createElement('div');
      box.className = 'q';
      var stem = document.createElement('p');
      stem.className = 'stem';
      stem.textContent = (qi + 1) + '. ' + q.stem;
      box.appendChild(stem);

      var buttons = [];
      q.options.forEach(function (opt, oi) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'opt';
        b.textContent = opt;
        b.addEventListener('click', function () {
          buttons.forEach(function (x) { x.disabled = true; });
          buttons[q.answer].classList.add('correct');
          if (oi === q.answer) { right++; } else { b.classList.add('wrong'); }
          box.classList.add('answered');
          answered++;
          if (answered === questions.length) {
            score.textContent = 'Resultado: ' + right + '/' + questions.length +
              (right === questions.length ? ' — perfeito.' : ' — releia os "porquês" acima e tente de novo amanhã (retrieval espaçado).');
          }
        });
        buttons.push(b);
        box.appendChild(b);
      });

      if (q.why) {
        var why = document.createElement('p');
        why.className = 'why';
        why.textContent = 'Por quê: ' + q.why;
        box.appendChild(why);
      }
      root.appendChild(box);
    });

    root.appendChild(score);
  });
})();
