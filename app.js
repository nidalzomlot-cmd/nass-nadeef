// نَصّ نظيف — كل المعالجة تتم داخل المتصفح، لا يُرسل أي نص لأي سيرفر.
(function (root) {
  'use strict';

  var AR = '؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿';
  var arChar = new RegExp('[' + AR + ']');

  function stripTables(t, mode) {
    // صف الفاصل |---|---|
    t = t.replace(/^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*\n?/gm, '');
    // صفوف الجدول → خلايا مفصولة بـ " - "
    return t.replace(/^[ \t]*\|(.+)\|[ \t]*$/gm, function (_, row) {
      return row.split('|').map(function (c) { return c.trim(); }).filter(Boolean).join(' - ');
    });
  }

  function markdown(t, mode) {
    // كتل الكود ```
    t = t.replace(/```[^\n]*\n([\s\S]*?)```/g, '$1');
    t = stripTables(t, mode);
    // العناوين
    t = t.replace(/^[ \t]{0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm, mode === 'whatsapp' ? '\u0001$1\u0001' : '$1');
    // الخطوط الفاصلة
    t = t.replace(/^[ \t]*([-*_])([ \t]*\1){2,}[ \t]*$/gm, '');
    // الاقتباس
    t = t.replace(/^[ \t]*>[ \t]?/gm, '');
    // الصور والروابط
    t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, mode === 'plain' ? '$1' : '$1 ($2)');
    // عريض/مائل
    var B = mode === 'whatsapp' ? '\u0001$2\u0001' : '$2';
    t = t.replace(/(\*\*|__)(?=\S)([\s\S]+?)(?<=\S)\1/g, B);
    t = t.replace(/(^|[^*\w])\*(?=\S)([^*\n]+?)(?<=\S)\*(?!\*)/g, mode === 'whatsapp' ? '$1_$2_' : '$1$2');
    t = t.replace(/~~(.+?)~~/g, mode === 'whatsapp' ? '~$1~' : '$1');
    t = t.replace(/`([^`\n]+)`/g, mode === 'whatsapp' ? '```$1```' : '$1');
    t = t.replace(/\u0001/g, '*');
    // القوائم
    t = t.replace(/^(\s*)[-*+]\s+\[[ xX]\]\s+/gm, '$1• ');
    t = t.replace(/^(\s*)[-*+]\s+/gm, '$1• ');
    return t;
  }

  function punctuation(t) {
    var a = '[' + AR + ']';
    t = t.replace(new RegExp('(' + a + ')\\s*,', 'g'), '$1،');
    t = t.replace(new RegExp(',\\s*(?=' + a + ')', 'g'), '، ');
    t = t.replace(new RegExp('(' + a + ')\\s*;', 'g'), '$1؛');
    t = t.replace(new RegExp('(' + a + ')\\s*\\?', 'g'), '$1؟');
    t = t.replace(/،(?=\S)/g, '، ').replace(/؛(?=\S)/g, '؛ ');
    return t;
  }

  var WEST = '0123456789', EAST = '٠١٢٣٤٥٦٧٨٩';
  function digits(t, to) {
    if (to === 'east') return t.replace(/[0-9]/g, function (d) { return EAST[d]; });
    if (to === 'west') return t.replace(/[٠-٩]/g, function (d) { return WEST[EAST.indexOf(d)]; });
    return t;
  }

  function clean(text, o) {
    o = o || {};
    var t = String(text || '').replace(/\r\n?/g, '\n');
    if (o.mode !== 'keep') t = markdown(t, o.mode || 'plain');
    if (o.punct) t = punctuation(t);
    if (o.digits) t = digits(t, o.digits);
    if (o.tashkeel) t = t.replace(/[ً-ْٰ]/g, '');
    if (o.tatweel) t = t.replace(/ـ/g, '');
    if (o.emoji) t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '');
    if (o.bidi) t = t.replace(/[‎‏‪-‮⁦-⁩]/g, '');
    t = t.replace(/[ \t]+$/gm, '');
    if (o.blank) t = t.replace(/\n{3,}/g, '\n\n');
    return t.trim();
  }

  function stats(t) {
    var words = (t.match(/\S+/g) || []).length;
    return { words: words, chars: t.length };
  }

  var api = { clean: clean, stats: stats, isArabic: function (s) { return arChar.test(s); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NassNadeef = api;

  if (typeof document === 'undefined') return;
  document.addEventListener('DOMContentLoaded', function () {
    var $ = function (id) { return document.getElementById(id); };
    var input = $('input'), output = $('output');
    function opts() {
      return {
        mode: document.querySelector('input[name=mode]:checked').value,
        punct: $('o-punct').checked, tashkeel: $('o-tashkeel').checked,
        tatweel: $('o-tatweel').checked, emoji: $('o-emoji').checked,
        bidi: $('o-bidi').checked, blank: $('o-blank').checked,
        digits: $('o-digits').value
      };
    }
    function run() {
      var r = clean(input.value, opts());
      output.value = r;
      var s = stats(r);
      $('stats').textContent = s.words + ' كلمة · ' + s.chars + ' حرف';
    }
    document.querySelectorAll('#controls input, #controls select').forEach(function (el) {
      el.addEventListener('change', run);
    });
    input.addEventListener('input', run);
    $('copy').addEventListener('click', function () {
      var done = function () { $('copy').textContent = 'تم النسخ ✓'; setTimeout(function () { $('copy').textContent = 'نسخ النتيجة'; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(output.value).then(done, function () { output.select(); document.execCommand('copy'); done(); });
      else { output.select(); document.execCommand('copy'); done(); }
    });
    $('clear').addEventListener('click', function () { input.value = ''; run(); input.focus(); });
    $('sample').addEventListener('click', function () {
      input.value = '## خطة المذاكرة للأسبوع\n\n**الهدف:** إنهاء 3 فصول, مع مراجعة يومية.\n\n- الأحد: الفصل الأول\n- الاثنين: الفصل الثاني\n- الثلاثاء: *مراجعة* سريعة\n\n---\n\n| اليوم | المادة |\n|---|---|\n| الأحد | رياضيات |\n\nهل أنت جاهز?';
      run();
    });
    run();
  });
})(typeof window !== 'undefined' ? window : globalThis);
