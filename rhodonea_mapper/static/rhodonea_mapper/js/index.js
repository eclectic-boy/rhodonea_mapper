class ApiClient {
  constructor(rhodoneaMapper, baseUrl) {
    this.rhodoneaMapper = rhodoneaMapper;
    this.baseUrl = baseUrl;
  }

  flattenErrors(errorJson) {
    let errors = [];
    for (let [property, msgs] of Object.entries(errorJson)) {
      errors.push(`${property}: ${msgs.concat()}`);
    }
    return errors.concat("<br>");
  }

  async fetch(method, path, query = {}, data) {
    // Return a response promise
    let querystring = $.param(query);
    let url = `${this.baseUrl}${path}?${querystring}`;

    return await fetch(url, {
      method: method.toUpperCase(),
      mode: "same-origin",
      headers: {
        'Content-Type': 'application/json',
      },
      body: data && JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw response;
        }
        return response;
      })
      .catch((response) => {
        response.json()
          .then((json) => {
            this.rhodoneaMapper.showAlertError(
              this.flattenErrors(json)
            );
          });
        throw response;
      });
  }

  async fetchJson(method, path, query = {}, data) {
    let response = await this.fetch(method, path, query, data);
    return await response.json();
  }
}


class Layer {
  constructor(id, manager, name) {
    /*
    args = {
      name: <str>//name for this layer (must be unique within the manager)
    }
    */

    this.visible = true;
    this.name = name;
    this.id = id;

    this.manager = manager;  // <LayersManager> defined in LayersManager
  }

  wrapInFeatureCollection(feature) {
    /*
    feature = <obj/GeoJSON.Feature>
    */
    return {
      "type": "FeatureCollection",
      "features": [feature]
    };
  }

  addFeature(feature) {
    /*
    feature = <obj/GeoJSON.Feature>
    */
    Object.assign(feature.properties, {
      "layerName": this.name,
      "_id": `${this.id}|${+new Date()}`,
    });

    let fc = this.wrapInFeatureCollection(feature);
    let data = this.manager.getData();

    return data.addGeoJson(fc, {idPropertyName: "_id"})[0];
  }

  addGeometry(geometry, properties) {
    /*
      geometry = <obj/GeoJSON.Geometry>
      properties = <obj>
    */

    let feature = {
      "type": "Feature",
      "geometry": geometry,
      "properties": properties || {}
    };

    let mapFeature = this.addFeature(feature);

    for (let [key, value] of Object.entries(properties)) {
      mapFeature.setProperty(key, value);
    }

    this.manager.updateStyle();

    return mapFeature;
  }

  updateGeometry(feature, geometry, properties) {
    feature.setGeometry(
      new google.maps.Data.LineString(_.map(geometry.coordinates, function (x) {
        return new google.maps.LatLng(x[1], x[0]);
      }))
    );

    for (let [key, value] of Object.entries(properties)) {
      feature.setProperty(key, value);
    }

    this.manager.updateStyle();
  }

  getFeatures() {
    let data = this.manager.getData();
    let features = [];
    let name = this.name;

    data.forEach((f) => {
      if (f.getProperty("layerName") === name) {
        features.push(f);
      }
    });

    return features;
  }

  getFeature(id) {
    let data = this.manager.getData();
    return data.getFeatureById(id);
  }

  removeFeature(feature) {
    let data = this.manager.getData();
    data.remove(feature);
  }

  drop() {
    let data = this.manager.getData();
    let features = this.getFeatures();

    for (let f of features) {
      data.remove(f);
    }
  }
}


class LayersManager {
  constructor(rhodoneaMapper) {
    /*
    args = {
      map: <google.maps.Map>
    }
    */

    this.rhodoneaMapper = rhodoneaMapper;
    this.map = this.rhodoneaMapper.map;
    this.layers = {
      // layerName: <Layer>,
    };

    this.creationsCounter = 0;
    this.updateStyle();
  }

  getLayer(name) {
    return this.layers[name];
  }

  addLayer(name) {
    if (this.getLayer[name] !== undefined) {
      throw `The layer name "${name}" has already been used`;
    }

    this.creationsCounter++;
    let layer = new Layer(this.creationsCounter, this, name);

    this.layers[name] = layer;
    return layer;
  }

  dropLayer(name) {
    this.layers[name].drop();
    delete this.layers[name];
  }

  getData() {
    return this.map.data;
  }

  getFeature(id) {
    return this.getData().getFeatureById(id);
  }

  updateStyle(visible = true) {
    this.getData().setStyle(function (feature) {
      return {
        visible: true,
        strokeWeight: feature.getProperty("strokeWeight"),
        strokeColor: feature.getProperty("strokeColor"),
      };
    });
  };
}


class DrawerList {
  constructor(drawer) {
    this.drawer = drawer;

    this.node = this.drawer.node.find("#list");
    this.setUpUI();
  }

  setUpUI() {
    let me = this;

    this.node.find(".save").click(function () {
      if (confirm("Do you really want to make this layer public?")) {
        me.drawer.save();
      }
    });

    this.node.find("#addItem").click(function () {
      me.drawer.addItem();
    });

    this.node.find(".buttons .reset").click(function () {
      if (confirm("Do you really want to reset this layer?")) {
        me.node.find(".badge").trigger("click");
        me.node.find("[name='title']").val("");
      }
    });
  }

  appendItem(item) {
    this.node.find(".list-group").append(item);
    this.node.get(0).scrollTop = this.node.get(0).scrollHeight;
  }

  show() {
    this.node.removeClass("slideLeft").addClass("slideRight");
  }

  hide() {
    this.node.removeClass("slideRight").addClass("slideLeft");
  }

  reset() {
    this.node.find("[name='title']").val("");
    this.node.find(".list-group").html("");
  }
}


class DrawerForm {
  constructor(drawer) {
    this.drawer = drawer;
    this.node = this.drawer.node.find("#form");

    this.setUpUI();
  }

  setUpUI() {
    let me = this;

    this.node.find(".buttons .save").click(function () {
      try {
        me.validateForm(true);

        me.drawer.currentItem
          .find(".featureName")
          .html(me.node.find("[name='name']").val())
          .addClass("used");

        me.node.submit();

        me.drawer.goToList();
      } catch (e) {
        me.drawer.rhodoneaMapper.showAlertError(e);
      }
    });

    this.node.find(".buttons .discard").click(function () {
      if (confirm("Do you really want to discard the changes?")) {
        me.node.find(".buttons .refresh").trigger("click", [me.drawer.backup]);
        me.drawer.goToList();
      }
    });

    this.node.find(".coordinateLock").click(function () {
      me.drawer.lockCoordinates($(this).hasClass("fa-unlock-alt"));
    });

    this.node.find("input").change(function () {
      me.node.find(".buttons .refresh").trigger("click");
    });

    this.node.find(".buttons .random").click(function () {
      me.setRandomFormData();
      me.node.find(".buttons .refresh").trigger("click");
    });

    this.node.submit(function (event) {
      event.preventDefault();
      me.node.find(".buttons .refresh").trigger("click");
    });

    this.node.find(".buttons .refresh").click(function (event, backup) {
      try {
        me.validateForm();
        me.drawer.refresh(backup);
      } catch (e) {
      }
    });

    this.node.find('[data-toggle="tooltip"]').tooltip();

    this.node.find(":submit").hide();
  }

  getInput(name) {
    return this.node.find(`[name="${name}"]`);
  }

  makeInputInvalid(input) {
    input.addClass('is-invalid');
  }

  makeInputValid(input) {
    input.removeClass('is-invalid');
  }

  validateForm(submitting = false) {
    let input;

    if (submitting === true) {
      input = this.getInput("name");
      if (input.val() === "") {
        this.makeInputInvalid(input);
      } else {
        this.makeInputValid(input);
      }
    }

    input = this.getInput("r");
    if (input.val() === "") {
      this.makeInputInvalid(input);
    } else {
      this.makeInputValid(input);
    }

    input = this.getInput("n");
    if (input.val() === "") {
      this.makeInputInvalid(input);
    } else {
      this.makeInputValid(input);
    }

    input = this.getInput("d");
    if (input.val() === "") {
      this.makeInputInvalid(input);
    } else {
      this.makeInputValid(input);
    }

    input = this.getInput("lng");
    if (input.val() === "") {
      this.makeInputInvalid(input);
    } else {
      this.makeInputValid(input);
    }

    input = this.getInput("lat");
    if (input.val() === "") {
      this.makeInputInvalid(input);
    } else {
      this.makeInputValid(input);
    }

    input = this.getInput("nodes_count");
    if (input.val() === "") {
      this.makeInputInvalid(input);
    } else {
      this.makeInputValid(input);
    }

    input = this.getInput("rotation");
    if (input.val() === "") {
      this.makeInputInvalid(input);
    } else {
      this.makeInputValid(input);
    }

    input = this.getInput("strokeWeight");
    if (input.val() === "") {
      this.makeInputInvalid(input);
    } else {
      this.makeInputValid(input);
    }

    input = this.getInput("strokeColor");
    if (input.val() === "") {
      this.makeInputInvalid(input);
    } else {
      this.makeInputValid(input);
    }

    if (this.node.find('.is-invalid').length) {
      throw "Please correct the errors below";
    }
  }

  collectData() {
    return {
      name: this.node.find("[name='name']").val(),
      r: parseFloat(this.node.find("[name='r']").val()),
      n: parseFloat(this.node.find("[name='n']").val()),
      d: parseFloat(this.node.find("[name='d']").val()),
      lng: parseFloat(this.node.find("[name='lng']").val()),
      lat: parseFloat(this.node.find("[name='lat']").val()),
      nodes_count: parseFloat(this.node.find("[name='nodes_count']").val()),
      rotation: parseFloat(this.node.find("[name='rotation']").val()),
      strokeWeight: parseFloat(this.node.find("[name='strokeWeight']").val()),
      strokeColor: this.node.find("[name='strokeColor']").val()
    };
  }

  getRandomColor() {
    //http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript#answer-1484514
    let letters = '0123456789ABCDEF'.split('');
    let color = ['#'];
    for (let i = 0; i < 6; i++) {
      color.push(letters[Math.floor(Math.random() * 16)]);
    }
    return color.join("");
  }

  clearName() {
    this.node.find("[name='name']").val("");
  }

  setRandomFormData() {
    this.node.find("[name='r']").val(_.random(1000, 4000));
    this.node.find("[name='n']").val(_.random(1, 20));
    this.node.find("[name='d']").val(_.random(1, 20));
    this.node.find("[name='rotation']").val(_.random(0, 360));
    this.node.find("[name='nodes_count']").val(_.random(500, 1000));
    this.node.find("[name='strokeWeight']").val(_.random(1, 5));
    this.node.find("[name='strokeColor']").val(this.getRandomColor());
  }

  setCenter(point) {
    this.node.find("[name='lat']").val(Math.round(point.lat() * 1000000) / 1000000);
    this.node.find("[name='lng']").val(Math.round(point.lng() * 1000000) / 1000000);
    this.node.find("[name='lat']").trigger("change");
  }

  lockCoordinates(status) {
    this.node.find("[name='lng'], [name='lat']").prop('readonly', status);
    if (status) {
      this.node.find(".coordinateLock").removeClass("fa-unlock-alt").addClass("fa-lock");
    } else {
      this.node.find(".coordinateLock").removeClass("fa-lock").addClass("fa-unlock-alt");
    }
  }

  setDefaultData(defaults) {
    for (let [key, value] of Object.entries(defaults)) {
      this.node.find(`[name='${key}']`).val(value);
    }
  }

  setFeatureData(feature) {
    for (let key of Object.keys(this.drawer.DEFAULTS)) {
      this.node.find(`[name='${key}']`).val(feature.getProperty(key));
    }
  }
}


class Drawer {
  DEFAULTS = {
    name: "",
    r: 1000,
    n: 3,
    d: 1,
    lng: 0,
    lat: 0,
    rotation: 0,
    nodes_count: 1000,
    strokeWeight: 2,
    strokeColor: "#311807",
  };

  constructor(rhodoneaMapper) {
    this.backup = {};
    this.isLoaded = true;
    this.rhodoneaMapper = rhodoneaMapper;
    this.centerChangedEvent = null;
    this.layerInstance = null;
    this.currentFeature = null;
    this.currentItem = null;

    this.node = $("#drawer");
    this.list = new DrawerList(this);
    this.form = new DrawerForm(this);
  }

  goToList() {
    this.currentFeature = null;
    this.currentItem = null;
    this.stopCenterTracking();
    this.list.show();
  }

  goToForm() {
    this.list.hide();
  }

  refresh(backup) {
    let args = backup === undefined ? this.form.collectData() : backup;
    let rh = this.rhodoneaMapper.buildRhodonea(args);

    if (!this.currentFeature) {
      this.currentFeature = this.layerInstance.addGeometry(rh, args);
      this.currentItem.attr("_id", this.currentFeature.getId());
    } else {
      this.layerInstance.updateGeometry(this.currentFeature, rh, args);
    }
  }

  save() {
    try {
      let data = {
        "title": this.node.find("[name='title']").val(),
        "rhodoneas": [],
      };

      let features = this.layerInstance.getFeatures();
      if (features.length === 0) {
        throw "Please add at least one rhodonea";
      }

      for (let f of features) {
        let props = {};
        for (let key of Object.keys(this.DEFAULTS)) {
          let payloadKey = key;

          if (key === 'strokeColor') {
            payloadKey = 'stroke_color';
          } else if (key === 'strokeWeight') {
            payloadKey = 'stroke_weight';
          }

          props[payloadKey] = f.getProperty(key);
        }

        props.point = {
          "type": "Point",
          "coordinates": [props.lng, props.lat]
        };
        delete props.lng;
        delete props.lat;

        data.rhodoneas.push(props);
      }

      this.rhodoneaMapper.loader.start();

      this.rhodoneaMapper.api.fetchJson("POST", "layers/", {}, data)
        .then((out) => {
          this.rhodoneaMapper.showAlertSuccess("Rhodonea successfully added!");
          this.unload([out.id]);
        })
        .finally(() => {
          this.rhodoneaMapper.loader.stop();
        });

    } catch (error) {
      this.rhodoneaMapper.showAlertError(error);
    }
  }

  addItem() {
    let me = this;

    let item = $(`
      <a href="javascript:void(0);" class="list-group-item d-flex justify-content-between align-items-center">
        <span class="featureName">Click to edit this curve</span>
        <span class="badge badge-pill"><i class="fa fa-minus"></i></span>
      </a>
    `)
      .click(function () {
        me.currentItem = $(this);

        let _id = me.currentItem.attr("_id");

        if (_id) {
          //set feature values in form
          me.currentFeature = me.layerInstance.getFeature(_id);
          me.lockCoordinates(true);
          me.form.setFeatureData(me.currentFeature);
        } else {
          //set default values
          me.form.setRandomFormData();
          me.form.clearName();
          me.lockCoordinates(false);
        }

        me.refresh();

        //back-up original properties in form
        me.backup = {};
        for (let key of Object.keys(me.DEFAULTS)) {
          me.backup[key] = me.currentFeature.getProperty(key);
        }

        me.goToForm();
      })
      .hover(function () {
        $(this).find(".badge").show();
      }, function () {
        $(this).find(".badge").hide();
      });

    item.find(".badge").click(function () {
      let _id = item.attr("_id");
      if (_id) {
        me.layerInstance.removeFeature(me.layerInstance.getFeature(_id));
      }
      item.remove();
    });

    this.list.appendItem(item);
  }

  startCenterTracking() {
    let me = this;
    this.centerChangedEvent = google.maps.event.addListener(
      this.rhodoneaMapper.map, "center_changed", function (event) {
        me.form.setCenter(this.getCenter());
      }
    );

    google.maps.event.trigger(this.rhodoneaMapper.map, "center_changed");
  }

  stopCenterTracking() {
    if (this.centerChangedEvent) {
      google.maps.event.removeListener(this.centerChangedEvent);
      this.centerChangedEvent = null;
    }
  }

  load() {
    let tl = this.rhodoneaMapper.timeline;
    tl.disable();
    tl.node.fadeOut();

    this.isLoaded = true;
    this.node.slideDown();

    this.layerInstance = this.rhodoneaMapper.layersManager.addLayer(
      "_drawerLayer"
    );
    this.node.find("#addItem").trigger("click");
  };

  unload(showIds = []) {
    let tl = this.rhodoneaMapper.timeline;
    tl.enable();

    if (!this.rhodoneaMapper.booting) {
      tl.refresh({showIds});
    }
    tl.node.fadeIn();

    this.isLoaded = false;
    this.node.slideUp();
    this.list.reset();
    if (this.layerInstance) {
      this.rhodoneaMapper.layersManager.dropLayer(this.layerInstance.name);
    }
    this.backup = {};
    this.goToList();
  }

  lockCoordinates(status) {
    this.form.lockCoordinates(status);

    if (status) {
      this.stopCenterTracking();
    } else {
      this.startCenterTracking();
    }
  }
}


class Timeline {
  constructor(rhodoneaMapper) {
    this.rhodoneaMapper = rhodoneaMapper;
    this.node = $("#timeline");
    this.isActive = true;
    this.filters = {
      search: "",
      in_bbox: "",
      offset: 0,
      limit: 10,
    };

    this.setUpUI();
  }

  get isFirstChunk() {
    return this.filters.offset === 0;
  }

  setUpUI() {
    let me = this;

    this.node.find("#more a").click(function () {
      let nextUrl = $(this).attr("next");
      if (nextUrl) {
        let query = new URLSearchParams(nextUrl);
        me.filters['offset'] = query.get('offset');
        me.filters['limit'] = query.get('limit');
        me.refresh();
      }
    });
  }

  enable() {
    this.isActive = true;
  }

  disable() {
    this.isActive = false;
  }

  serializeEnvelopeAsBbox(envelope) {
    return [
      envelope.coordinates[0][0][0],
      envelope.coordinates[0][0][1],
      envelope.coordinates[0][2][0],
      envelope.coordinates[0][2][1],
    ].join(",");
  }

  updateInBboxFilter() {
    this.filters.offset = 0;
    this.filters.in_bbox = this.rhodoneaMapper.getMapBoundsString();
  }

  buildItem(args) {
    let me = this;

    let item = $(`
      <div class="card item panel-default">
        <div class="card-body">${args.title}</div>
        <div class="card-footer">
          <table><tr></tr></table>
        </div>
      </div>
    `);

    item.find(".card-footer tr").append(`
			<td>
			  <i class="fa fa-clock-o" title="${new Date(args.created)}">
          &nbsp;${moment(args.created).fromNow()}
        </i>
      </td>
			<td>
        <i class="fa fa-eye" title="Number of visualizations of this layer">
          &nbsp;<span class="visitsCounter">${args.overlays_count}</span>
        </i>
			</td>
			<td>
			  <i class="fa flyTo fa-location-arrow" bbox="${me.serializeEnvelopeAsBbox(args.envelope)}" title="Fly to this layer"></i>
			</td>
			<td>
        <i class="fa">
          <input type="checkbox" class="switch" layerName="Layer__${args.id}" instanceID="${args.id}">
        </i>
			</td>
		`);

    item.find(".flyTo").click(function () {
      let bbox = $(this).attr("bbox").split(",");
      me.rhodoneaMapper.map.fitBounds(new google.maps.LatLngBounds(
        new google.maps.LatLng(bbox[1], bbox[0]),
        new google.maps.LatLng(bbox[3], bbox[2])
      ));
    });

    item.find(".switch").bootstrapToggle({
      size: "mini",
      on: "On",
      off: "Off",
      onstyle: "primary",
      offstyle: "default",
    });

    item.find(".switch").change(function () {
      if ($(this).prop('checked')) {
        let toggle = $(this);
        toggle.bootstrapToggle('disable');

        me.rhodoneaMapper.buildLayer(
          toggle.attr("layerName"),
          toggle.attr("instanceID"),
          function (layer) {
            toggle.bootstrapToggle('enable');
          }
        );

        let visits = me.node.find(".item").has($(this)).find(".visitsCounter");
        visits.html(parseInt(visits.html(), 10) + 1);
      } else {
        me.rhodoneaMapper.layersManager.dropLayer($(this).attr("layerName"));
      }
    });

    return item;
  };

  refresh(args = {}) {
    if (!this.isActive) {
      return;
    }

    let me = this;
    let showIds = args.showIds || [];

    let items = me.node.find("#items");

    if (this.isFirstChunk) {
      items.html("");
    }

    this.rhodoneaMapper.loader.start();

    this.rhodoneaMapper.api.fetchJson("GET", "layers/", this.filters)
      .then((out) => {
        if (out.next) {
          me.node.find("#more a").attr("next", out.next).show();
        } else {
          me.node.find("#more a").attr("next", "").hide();
        }

        for (let x of out.results) {
          items.append(me.buildItem(x));
        }

        //remove layers previously overlaid and no more available
        for (let layerName in me.rhodoneaMapper.layersManager.layers) {
          let ctrl = me.node.find(`#items .switch[layerName="${layerName}"]`);

          if (ctrl.length) {
            ctrl.data("bs.toggle").on(true);
          } else {
            me.rhodoneaMapper.layersManager.dropLayer(layerName);
          }
        }

        //show layers related to showIds (if defined)
        for (let id of showIds) {
          me.node
            .find(`#items .switch[instanceID="'${id}'"]`)
            .bootstrapToggle('on');
        }

        if (!out.results.length) {
          items.html(`
            <div class='empty'>
              No layers are available in this bounding box, why don't you create the first one?
            </div>
          `);
        }

      })
      .finally(() => {
        me.rhodoneaMapper.loader.stop();
      });
  }
}


class Loader {
  constructor(rhodoneaMapper) {
    this.rhodoneaMapper = rhodoneaMapper;

    this.node = $("#showDrawer");
    this.handle = this.node.find('.handle');
    this.count = 0;

    this.setUpUI();
  }

  get drawer() {
    return this.rhodoneaMapper.drawer;
  }

  setUpUI() {
    let me = this;

    this.node
      .click(function () {
        if (!me.drawer.isLoaded) {
          me.drawer.load();
          $(this).addClass("active");
        } else {
          me.drawer.unload();
          $(this).removeClass("active");
        }
      });
  }

  triggerEvents() {
    this.node.trigger("click");
  }

  start() {
    this.count++;
    if (this.count === 1) {
      this.handle.addClass("rotatingLoader");
    }
  };

  stop() {
    this.count--;
    if (this.count === 0) {
      this.handle.removeClass("rotatingLoader");
    }
  };
}


class RhodoneaMapper {
  DEFAULT_LOCATION = {
    lat: 51.509865,
    lng: -0.118092,
  };

  constructor(callback) {
    this.booting = true;

    this.mapEvent;
    this.mapNode = $("#map");
    this.map = new google.maps.Map(this.mapNode.get(0), {
      center: {lng: -0.12, lat: 51.50},
      zoom: 13,
    });

    this.api = new ApiClient(this, '/rhodonea-mapper/api/');

    this.drawer = new Drawer(this);
    this.loader = new Loader(this);
    this.layersManager = new LayersManager(this);
    this.timeline = new Timeline(this);

    this.setUpUI();

    this.geolocateUser();

    $(".hidden").removeClass("hidden");

    if (callback) {
      callback(this);
    }
  }

  geolocateUser() {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.map.setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      }, (error) => {
        this.map.setCenter(this.DEFAULT_LOCATION);
      });
    } else {
      // Browser doesn't support Geolocation
      this.map.setCenter(this.DEFAULT_LOCATION);
    }
  }

  setUpUI() {
    let me = this;

    $(window)
      .resize(function () {
        let mapH = window.innerHeight * 80 / 100;

        $("*").has(me.mapNode).last().addClass("map_container");

        google.maps.event.trigger(this.map, "resize");
        me.mapNode.css("height", `${mapH}px`);

        let sidebarH = mapH + mapH * 8 / 100;
        $("#sidebar").css({
          "height": `${sidebarH}px`,
          "margin-top": `-${mapH * 4 / 100}px`,
          "margin-bottom": `${mapH * 4 / 100}px`,
        });

        let controlsH = $("#sidebar #controls .handle").height();

        let h_ = sidebarH - controlsH - 10;
        $("#sidebar #drawer #list").css({"height": `${h_}px`});
        $("#sidebar #timeline").css({"height": `${h_}px`});
      })
      .trigger("resize");

    $(".alert").hide();

    $("#showHelp").click(function () {
      $("#helpModal").modal();
    });

    this.mapEvent = google.maps.event.addListener(
      this.map,
      "idle",
      function (event) {
        me.timeline.updateInBboxFilter();
        me.timeline.refresh();
      }
    );

    this.loader.triggerEvents();
  }

  getMapBounds() {
    let bbox = this.map.getBounds();
    if (!bbox) {
      return null;
    }

    let ne = bbox.getNorthEast();
    let sw = bbox.getSouthWest();
    return [sw.lng(), sw.lat(), ne.lng(), ne.lat()];
  }

  getMapBoundsString() {
    let bounds = this.getMapBounds();
    return bounds && bounds.join(",");
  }

  showAlertError(msg, timeout = 3000) {
    $("#alert_error")
      .fadeIn()
      .find(".msg").html(msg);

    if (timeout) {
      let to = setInterval(() => {
        this.hideAlertError();
        clearInterval(to);
      }, timeout);
    }
  }

  hideAlertError() {
    $("#alert_error").fadeOut();
  }

  showAlertSuccess(msg, timeout = 3000) {
    $("#alert_success")
      .fadeIn()
      .find(".msg").html(msg);

    if (timeout) {
      let to = setInterval(() => {
        this.hideAlertSuccess();
        clearInterval(to);
      }, timeout);
    }
  }

  hideAlertSuccess() {
    $("#alert_success").fadeOut();
  }

  buildRhodonea(args) {
    /*
    args = {
      lng: <float>,//lng of the center.
      lat: <float>,//lat of the center.
      r: <float>,//radius of the container circle.
      n: <float>,//n parameter.
      d: <float>,//d parameter.
      nodes_count: <int>,//number of nodes_count for drawing the curve.
      rotation: <int>,//rotation to apply.
    }
    */

    let center = new google.maps.LatLng(args.lat, args.lng);
    let nodes_count = args.nodes_count;
    let r = args.r;
    let n = args.n;
    let d = args.d;
    let rotation = 90 + (args.rotation || 0);
    let laps = Math.floor(args.d) === args.d ? args.d : Math.floor(args.d) + 1;

    let shape = {
      "type": "LineString",
      "coordinates": [],
    };

    let alpha = 2 * Math.PI * laps / nodes_count;

    for (let i = 0; i <= args.nodes_count; i++) {
      let theta = alpha * i;

      let radius = r * Math.sin(n / d * theta);

      let p = google.maps.geometry.spherical.computeOffset(
        center,
        radius,
        theta * 180 / Math.PI + rotation
      );

      shape.coordinates.push([p.lng(), p.lat()]);
    }

    return shape;
  };

  buildLayer(layerName, layerId, callback) {
    this.loader.start();

    this.api.fetchJson("GET", `layers/${layerId}/`)
      .then((out) => {
        let layer = this.layersManager.addLayer(layerName);

        for (let args of out.rhodoneas) {
          args.lng = args.point.coordinates[0];
          args.lat = args.point.coordinates[1];
          args.strokeColor = args.stroke_color;
          args.strokeWeight = args.stroke_weight;

          layer.addGeometry(this.buildRhodonea(args), args);
        }

        if (callback) {
          callback(layer);
        }
      })
      .catch((response) => {
        if (callback) {
          callback();
        }
      })
      .finally(() => {
        this.loader.stop();
      });
  }
}


function initRhodoneaMapper() {
  function callback(rhodoneaMapper) {
    rhodoneaMapper.booting = false;
  }

  window.rhodoneaMapper = new RhodoneaMapper(callback);
}
