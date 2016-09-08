define(function(require, exports, module) {
  "use strict";

  main.consumes = [
    "Plugin", "c9", "ui", "menus", "tabManager", "commands", "tree", "Form", "Dialog", "proc", "Divider", "dialog.alert", "dialog.progress"
  ];
  main.provides = ["newresource"];
  return main;

  function main(options, imports, register) {
    var Plugin = imports.Plugin;
    var c9 = imports.c9;
    var ui = imports.ui;
    var menus = imports.menus;
    var commands = imports.commands;
    var tabs = imports.tabManager;
    var tree = imports.tree;
    var Form = imports.Form;
    var Dialog = imports.Dialog;
    var proc = imports.proc;
    var Divider = imports.Divider;
    var alert = imports["dialog.alert"].show;
    var progress= imports["dialog.progress"];

    /***** Constants *****/
    var FAST_ARCHETYPE = {
      groupId: "fast",
      artifactId: "fast-app-archetype",
      version: "1.0.0-SNAPSHOT"
    };

    /***** Initialization *****/

    var plugin = new Plugin("snlab.org", main.consumes);

    var readonly = c9.readonly;
    var defaultExtension = "";

    var templateform = new Form({
      rowheight: 40,
      colwidth: 100,
      edge: "5 5 10 5",
      form:[
        {
          title: "Project name",
          name: "projectname",
          type: "textbox",
          defaultValue: "simple-test"
        },
        {
          title: "Version",
          name: "version",
          type: "textbox",
          defaultValue: "1.0.0-SNAPSHOT"
        },
        {
          title: "Package",
          name: "package",
          type: "textbox",
          defaultValue: "fast.simple.test"
        },
        {
          title: "Class prefix",
          name: "classprefix",
          type: "textbox",
          defaultValue: "FastSimpleTest"
        }
      ]
    });

    var fastDialog = new Dialog("snlab.org", main.consumes, {
      name: "create-a-fast-project",
      allowClose: true,
      title: "Create a FAST project",
      elements: [
        {
          type: "button",
          id: "cancel",
          color: "grey",
          caption: "Cancel",
          hotkey: "ESC",
          onclick: function(){ fastDialog.hide(); }
        },
        {
          type: "button",
          id: "ok",
          color: "green",
          caption: "OK",
          default: true,
          onclick: function(){
            createFastProject(templateform.toJson());
            fastDialog.hide();
          }
        }
      ]
    });

    var functionform = new Form({
      rowheight: 40,
      colwidth: 100,
      edge: "5 5 10 5",
      form:[
        {
          title: "Package",
          name: "package",
          type: "textbox",
          defaultValue: "fast.app"
        },
        {
          title: "Function Name",
          name: "name",
          type: "textbox",
          defaultValue: "MyFunction"
        },
      ]
    });

    var functionDialog = new Dialog("snlab.org", main.consumes, {
      name: "create-a-fast-funciton",
      allowClose: true,
      title: "Create a FAST Function",
      elements: [
        {
          type: "button",
          id: "cancel",
          color: "grey",
          caption: "Cancel",
          hotkey: "ESC",
          onclick: function(){ functionDialog.hide(); }
        },
        {
          type: "button",
          id: "ok",
          color: "green",
          caption: "OK",
          default: true,
          onclick: function(){
            createFastFunction(functionform.toJson());
            functionDialog.hide();
          }
        }
      ]
    });

    var loaded = false;
    function load(callback) {
      if (loaded) return false;
      loaded = true;

      commands.addCommand({
        name: "newfile",
        hint: "create a new file resource",
        msg: "New file created.",
        bindKey: { mac: "Ctrl-N", win: "Alt-N" },
        exec: function () { newFile(); }
      }, plugin);

      commands.addCommand({
        name: "newfolder",
        hint: "create a new directory resource",
        exec: function(){ newFolder(); }
      }, plugin);

      commands.addCommand({
        name: "fastproject",
        hint: "create a FAST project with the template",
        exec: function(){ fastDialog.show(); }
      }, plugin);

      commands.addCommand({
        name: "fastfunction",
        hint: "create a FAST function class",
        exec: function(){ functionDialog.show(); }
      }, plugin);

      menus.addItemByPath("File/New", new ui.item({
        disabled: readonly
      }), 200, plugin);
      menus.addItemByPath("File/New/Empty FAST Project", new ui.item({
        command: "fastproject"
      }), 210, plugin);
      menus.addItemByPath("File/New/FAST Example Project", new ui.item({
        disabled: readonly
      }), 220, plugin);
      menus.addItemByPath("File/New/~", new ui.divider(), 250, plugin);
      menus.addItemByPath("File/New/FAST Function", new ui.item({
        command: "fastfunction"
      }), 260, plugin);
      menus.addItemByPath("File/New/~", new ui.divider(), 320, plugin);
      menus.addItemByPath("File/New/Empty Maple App", new ui.item({
        disabled: readonly
      }), 330, plugin);
      menus.addItemByPath("File/New/Maple App from Template", new ui.item({
        command: "mapletemplate"
      }), 340, plugin);

      return loaded;
    }

    /***** Methods *****/

    function getDirPath () {
      var node = tree.getSelectedNode();
      var path = node.path || node.getAttribute("path");
      if (node.getAttribute ? node.getAttribute("type") == "file"
          || node.tagName == "file" : !node.isFolder)
        path = path.replace(/\/[^\/]*$/, "/");

      if (!/\/$/.test(path))
        path += "/";

      return path;
    }

    function newFile(type, value, path, name) {
      if (readonly) return;

      var filePath;
      var name = name || "Untitled";
      var count = 1;
      type = type || "";
      path = path || getDirPath();
      var ext = defaultExtension;

      while (tabs.findTab(filePath = path + name + (count || "") + type + ext))
        count++;

      tabs.open({
        path: filePath,
        value: value || "",
        active: true,
        document: {
          meta: {
            newfile: true
          }
        }
      }, function(err, tab) {
        if (err)
          return; // reported already
      });

    }

    function newFolder(path, callback) {
      tree.createFolder(path, false, callback || function(){});
    }

    function mavenArchetypeGenerator(archetype, args) {

      proc.spawn("mvn", {
        args: [
          "archetype:generate",
          "-DarchetypeGroupId=" + archetype.groupId,
          "-DarchetypeArtifactId=" + archetype.artifactId,
          "-DarchetypeVersion=" + archetype.version,
          "-DinteractiveMode=false"
        ].concat(
          Object.keys(args).map(function(key) {
            return "-D" + key + "=" + args[key];
          })
        ),
        cwd: c9.workspaceDir
      }, function(err, process) {
        // TODO: Feedback the error to user explicitly
        if (err) throw err;
        progress.show();
        process.stdout.on("data", function(chunk) {
          progress.update(chunk);
          console.log(chunk);
        }).on("end", function() {
          // TODO: report error if generation failed
          progress.hide();
        });
      });
    }

    function createFastProject(args){
      mavenArchetypeGenerator(FAST_ARCHETYPE, {
        groupId: "fast.app",
        artifactId: args.projectname,
        version: args.version,
        package: args.package,
        classPrefix: args.classprefix,
        copyright: "SNLab",
        copyrightYear: "2016"
      });
    }

    function createFastFunction(args) {
      var content = "/*\n" +
            " * Copyright © 2016 SNLab and others.  All rights reserved.\n" +
            " *\n" +
            " * This program and the accompanying materials are made available under the\n" +
            " * terms of the Eclipse Public License v1.0 which accompanies this distribution,\n" +
            " * and is available at http://www.eclipse.org/legal/epl-v10.html\n" +
            " */\n" +
            "\n" +
            "package \n" + args.package + ";" +
            "\n" +
            "import fast.api.FastDataStore;\n" +
            "import fast.api.Function;\n" +
            "\n" +
            "public class \n" + args.name + " implements Function {" +
            "\n" +
            "    private FastDataStore datastore = null;\n" +
            "\n" +
            "    public void init(FastDataStore datastore) {\n" +
            "        this.datastore = datastore;\n" +
            "    }\n" +
            "\n" +
            "    public void run() {\n" +
            "        /*\n" +
            "         * Implement your control logic here.\n" +
            "         * */\n" +
            "    }\n" +
            "}";
      newFile(".java", content, getDirPath(), args.name);
    }

    function parse(data){
      var list = [];
      var context = { template: [] };
      list.push(context);

      var restart;
      data.split("\n").forEach(function(line){
        if (/^(?:\t| {4})(.*)/.test(line)) {
          context.template.push(RegExp.$1);
          restart = true;
          return;
        }
        else if (restart) {
          list.push(context = { template: [] });
          restart = false;
        }

        if (!line) return;

        var m = line.match(/^(\w+) (.*)$/);
        if (m)
          context[m[1]] = m[2];
      });

      return list;
    }

    function addFileTemplate(data, forPlugin) {

      var list = parse(data);

      list.forEach(function(item){
        menus.addItemByPath("File/New/" + item.caption, new ui.item({
          disabled: readonly,
          onclick: function(){
            newFile(item.filename, item.template.join("\n"));
          }
        }), 400, forPlugin);
      });

    }

    /***** Lifecycle *****/

    fastDialog.on("draw", function(e){
      templateform.attachTo(e.html);
    });

    functionDialog.on("draw", function(e) {
      functionform.attachTo(e.html);
    });

    plugin.on("load", function(){
      load();
    });
    plugin.on("unload", function(){
      loaded = false;
      defaultExtension = null;
    });

    /***** Register and define API *****/

    /**
     * Adds File->New File and File->New Folder menu items as well as the
     * commands for opening a new file as well as an API.
     * @singleton
     **/
    plugin.freezePublicAPI({
      /**
       * Create a new file in the workspace
       *
       * @param {String} type   The encoding of the content for the file
       * @param {String} value  The content of the file
       * @param {String} path   The path of the file to write
       */
      newFile: newFile,

      /**
       * Create a new folder in the workspace and starts its renaming
       *
       * @param {String}   name          The name of the folder to create
       * @param {String}   dirPath       The directory to create the folder into
       * @param {Function} callback      Called after the folder is created
       * @param {Error}    callback.err  The error object if any error occured.
       */
      newFolder: newFolder,

      /**
       *
       */
      open: open,

      /**
       *
       */
      addFileTemplate: addFileTemplate,

      /**
       * Sets the default extension for newly created files
       * @param extension  The default extension to use
       */
      set defaultExtension(extension) {
        defaultExtension = extension ? "." + extension : "";
        tree.defaultExtension = extension;
      }
    });

    register(null, {
      newresource: plugin
    });
  }
});
