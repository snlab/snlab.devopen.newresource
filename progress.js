define(function(require, exports, module) {
  "use strict";

  main.consumes = ["Dialog", "ui"];
  main.provides = ["dialog.progress"];
  return main;

  function main(options, imports, register) {
    var Dialog = imports.Dialog;
    var ui = imports.ui;

    /***** Initialization *****/

    var logs;

    var plugin = new Dialog("snlab.org", main.consumes, {
      name: "show-operation-progress",
      allowClose: false,
      modal: true,
      title: "Maven Archetype Generating..."
    });

    /***** Methods *****/

    function update(log) {
      logs.innerHTML += log;
      logs.selectionStart = logs.selectionEnd = logs.value.length;
    }

    /***** Lifecycle *****/

    plugin.on("draw", function(e) {
      ui.insertCss(require("text!./progress.css"), false, plugin);

      var container = e.html.appendChild(document.createElement("div"));
      container.className = "progress-container";
      var div = container.appendChild(document.createElement("div"));
      div.className = "progress-bar";
      div.innerHTML = "<span class='bar-unfill'><span class='bar-fill-stripes'></span></span>";

      logs = container.appendChild(document.createElement("textarea"));
      logs.disabled = true;
      logs.style.width = "100%";
      logs.rows = 15;
    });

    plugin.on("hide", function() {
      logs.innerHTML = "";
    });

    /***** Register and define API *****/

    /**
     *
     */
    plugin.freezePublicAPI({
      /**
       *
       */
      update: update,

      /**
       *
       */
      show: plugin.show,

      /**
       *
       */
      hide: plugin.hide
    });

    register(null, {
      "dialog.progress": plugin
    });
  }
});
