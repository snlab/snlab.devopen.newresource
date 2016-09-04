define(function(require, exports, module) {
  "use strict";

  main.consumes = [
    "Plugin", "c9", "ui", "menus", "tabManager", "commands", "tree", "Form", "Dialog", "proc", "Divider", "dialog.alert"
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

    /***** Initialization *****/

    var plugin = new Plugin("snlab.org", main.consumes);

    var readonly = c9.readonly;
    var defaultExtension = "";

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
        disabled: readonly
      }), 210, plugin);
      menus.addItemByPath("File/New/FAST Example Project", new ui.item({
        command: "fastproject"
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

    function newFile(type, value, path) {
      if (readonly) return;

      var filePath;
      var name = "Untitled";
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

    var templateform = new Form({
      rowheight: 40,
      colwidth: 100,
      edge: "5 5 10 5",
      form:[
        {
          title: "Project name",
          name: "projectname",
          type: "textbox",
          defaultValue: "simple-test",
          // margin: "20 20 5 20",
        },
        {
          title: "Version",
          name: "version",
          type: "textbox",
          defaultValue: "1.0.0-SNAPSHOT"
          // margin: "20 20 5 20",
        },
        {
          title: "Package",
          name: "fastpackage",
          type: "textbox",
          defaultValue: "fast.simple.test"
          // margin: "20 20 5 20",
        },
        {
          title: "Class prefix",
          name: "classprefix",
          type: "textbox",
          defaultValue: "FastSimpleTest"
          // margin: "20 20 5 20",
        }
      ]
    });

    function createFastProject(){
      var jsonForm = templateform.toJson();
      var projectname = jsonForm.projectname;
      var version = jsonForm.version;
      var fastpackage = jsonForm.fastpackage;
      var classprefix = jsonForm.classprefix;

      proc.spawn("mvn", {
        args: [
          "archetype:generate",
          "-DarchetypeGroupId=test.fast",
          "-DarchetypeArtifactId=fast-app-archetype",
          "-DarchetypeVersion=1.0.0-SNAPSHOT",
          "-DgroupId=fast.app",
          "-DartifactId=" + projectname,
          "-Dversion=" + version,
          "-Dpackage=" + fastpackage,
          "-DclassPrefix=" + classprefix,
          "-Dcopyright=SNLab",
          "-DcopyrightYear=2016",
          "-DinteractiveMode=false"
        ],
        cwd: c9.workspaceDir
      }, function(err, process){
        if (err) throw err;
        process.stdout.on("data", function(chunk) {
          console.log(chunk);
        });
      });
    }

    var fastDialog = new Dialog("fastDialog", main.consumes, {
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
            createFastProject();
            fastDialog.hide();
          }
        }
      ]
    });

    fastDialog.on("draw", function(e){
      templateform.attachTo(e.html);
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

    function createFastFunction(args) {
      // TODO: create a FAST Function
      alert("package:" + args.package + "\nname:" + args.name);
    }

    var functionDialog = new Dialog("functionDialog", main.consumes, {
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

    functionDialog.on("draw", function(e) {
      functionform.attachTo(e.html);
    });

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

      templateform: templateform,

      fastDialog: fastDialog,


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
