define(function(require, exports, module) {
  "use strict";

  main.consumes = [
    "Plugin", "c9", "ui", "menus", "tabManager", "commands", "tree", "Form", "Dialog", "proc", "Divider", "dialog.alert", "dialog.progress", "settings"
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
    var settings = imports.settings;

    /***** Constants *****/
    var FAST_ARCHETYPE = {
      groupId: "fast",
      artifactId: "fast-app-archetype",
      version: "1.0.0-SNAPSHOT"
    };
    var MAPLE_ARCHETYPE = {
      groupId: "org.opendaylight.maple",
      artifactId: "maple-archetype",
      version: "1.0.0-Beryllium-SR2"
    };

    /***** Initialization *****/

    var plugin = new Plugin("snlab.org", main.consumes);

    var readonly = c9.readonly;
    var defaultExtension = "";

    var projects = [];

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
          onclick: function() { fastDialog.hide(); }
        },
        {
          type: "button",
          id: "ok",
          color: "green",
          caption: "OK",
          default: true,
          onclick: function() {
            fastDialog.hide();
            createFastProject(templateform.toJson());
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
            functionDialog.hide();
            createFastFunction(functionform.toJson());
          }
        }
      ]
    });

    var mapleform = new Form({
      rowheight: 40,
      colwidth: 100,
      edge: "5 5 10 5",
      form:[
        {
          title: "Maple App Name",
          name: "appname",
          type: "textbox",
          defaultValue: "SimpleMapleApp"
        }
      ]
    });

    var mapleDialog = new Dialog("snlab.org", main.consumes, {
      name: "create-a-maple-app",
      allowClose: true,
      title: "Create a Maple App",
      elements: [
        {
          type: "button",
          id: "cancel",
          color: "grey",
          caption: "Cancel",
          hotkey: "ESC",
          onclick: function() { mapleDialog.hide(); }
        },
        {
          type: "button",
          id: "ok",
          color: "green",
          caption: "OK",
          default: true,
          onclick: function() {
            mapleDialog.hide();
            createMapleApp(mapleform.toJson());
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

      commands.addCommand({
        name: "mapleapptemplate",
        hint: "create a Maple App with the template",
        exec: function(){ mapleDialog.show(); }
      }, plugin);

      commands.addCommand({
        name: "newtopology",
        hint: "create a virtual topology for mininet with d3.js based editor",
        exec: function(){ newFile(".topo"); }
      }, plugin);

      // commands.addCommand({
      //   name: "newnexttopology",
      //   hint: "create a virtual topology for mininet with NeXt editor",
      //   exec: function(){ newFile(".topo"); }
      // }, plugin);

      menus.addItemByPath("File/New", new ui.item({
        disabled: readonly
      }), 200, plugin);
      menus.addItemByPath("File/New/Empty Maple App Project", new ui.item({
        disabled: true
      }), 210, plugin);
      menus.addItemByPath("File/New/Maple App Example", new ui.item({
        command: "mapleapptemplate"
      }), 220, plugin);
      menus.addItemByPath("File/New/Empty FAST App Project", new ui.item({
        command: "fastproject"
      }), 230, plugin);
      menus.addItemByPath("File/New/FAST App Example", new ui.item({
        disabled: true
      }), 240, plugin);
      menus.addItemByPath("File/New/~", new ui.divider(), 300, plugin);
      menus.addItemByPath("File/New/New FAST Function", new ui.item({
        command: "fastfunction"
      }), 310, plugin);
      menus.addItemByPath("File/New/~", new ui.divider(), 400, plugin);
      menus.addItemByPath("File/New/New Mininet Topology", new ui.item({
        command: "newtopology"
      }), 410, plugin);
      // menus.addItemByPath("File/New/New Mininet Topology (NeXt)", new ui.item({
      //   command: "newnexttopology"
      // }), 410, plugin);

      // Context menu for tree
      var itemCtxTreeNewFunction = new ui.item({
        id: "itemCtxTreeNewFunction",
        match: "file|folder|project",
        caption: "New FAST Function",
        isAvailable: function(){
          // TODO: Check if selected a FAST project node
          return tree.selectedNode && findFastProject(tree.selected);
        },
        onclick: function(){
          functionDialog.show();
        }
      });
      tree.getElement("mnuCtxTree", function(mnuCtxTree) {
        ui.insertByIndex(mnuCtxTree, itemCtxTreeNewFunction, 1500, plugin);
      });

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
      var count = 0;
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

    function findFastProject(path) {
      var projects = settings.getJson("project/devopen/projects");
      for (var p in projects) {
        if (projects[p].type === "FAST" &&
            path.split('/')[1] === projects[p].name) {
          return projects[p];
        }
      }
      return false;
    }

    function updateProjectManager(args) {
      // TODO: update project information in project manager
      var projects = settings.getJson("project/devopen/projects") || {};
      projects[args.path] = args;
      settings.setJson("project/devopen/projects", projects);
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
        // TODO: handle process crash
      });
    }

    function createFastProject(form) {
      var args = {
        groupId: "fast.app",
        artifactId: form.projectname,
        version: form.version,
        package: form.package,
        classPrefix: form.classprefix,
        copyright: form.copyright || "SNLab",
        copyrightYear: form.copyrightYear || "2016"
      };
      mavenArchetypeGenerator(FAST_ARCHETYPE, args);
      args.type = "FAST";
      args.name = form.projectname;
      updateProjectManager(args);
    }

    function createMapleApp(form) {
      var args = {
        groupId: "maple.app",
        artifactId: form.appname,
        classPrefix: form.appname,
        copyright: form.copyright || "SNLab",
        copyrightYear: form.copyrightYear || "2016"
      };
      mavenArchetypeGenerator(MAPLE_ARCHETYPE, args);
      args.type = "MAPLE";
      args.name = form.appname;
      updateProjectManager(args);
    }

    function createFastFunction(args) {
      var content = require("text!./template/function.template")
            .replace(/\${copyrightYear}/g, args.copyrightYear || "2016")
            .replace(/\${copyright}/g, args.copyright || "SNLab")
            .replace(/\${name}/g, args.name)
            .replace(/\${package}/g, args.package);
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

    settings.on("read", function() {
      settings.setDefaults("project/devopen/projects", []);
    });

    fastDialog.on("draw", function(e){
      templateform.attachTo(e.html);
    });

    functionDialog.on("draw", function(e) {
      functionform.attachTo(e.html);
    });

    functionDialog.on("show", function() {
      var project = findFastProject(tree.selected);
      // HACK: The implementation is a little magic ;/
      functionDialog.aml.$ext.childNodes[5].childNodes["0"].childNodes["0"].childNodes[1].childNodes[1].childNodes[1].childNodes[1].textContent = project.package;
      functionDialog.aml.$ext.childNodes[5].childNodes["0"].childNodes["0"].childNodes[2].childNodes[1].childNodes[1].childNodes[1].textContent = project.name;
    });

    mapleDialog.on("draw", function(e) {
      mapleform.attachTo(e.html);
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
