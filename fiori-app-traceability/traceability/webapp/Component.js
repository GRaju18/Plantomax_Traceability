sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/9b/traceability/model/models",
	"sap/f/FlexibleColumnLayoutSemanticHelper",
	"sap/ui/model/json/JSONModel",
	"com/9b/traceability/model/LocalStorageModel"

], function (UIComponent, Device, models, FlexibleColumnLayoutSemanticHelper, JSONModel, LocalStorageModel) {
	"use strict";

	return UIComponent.extend("com.9b.traceability.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			var appModel = new JSONModel({
				busy: true,
				delay: 0,
				layout: "OneColumn",
				previousLayout: "",
				actionButtonsInfo: {
					midColumn: {
						fullScreen: false
					}
				},
				strainList: []
			});
			appModel.setSizeLimit(1000);
			this.setModel(appModel, "appModel");

			var jsonModel = new JSONModel({
				strainList: [],
				createMode: false,
				serLayerbaseUrl: "https://login.seedandbeyond.com:50000",
				userAuthPayload: {
					"CompanyDB": "QAS",
					"UserName": "SusmitaN",
					"Password": "Sreehan@123"
				},
				//set the app navigation URL model
				target: {
					Strain: "webclient-ext-strainlist-app-content-sapb1strainlist",
					PhenoTrack: "webclient-ext-PhenoTrack-app-v2-content-sapb1PhenoTrack",
					MicroPropagation: "webclient-ext-MicroPropagation-app-v2-content-sapb1MicroPropagation",
					MacroPropagation: "webclient-ext-MacroPropagation-app-v2-content-sapb1MacroPropagation",
					Cultivation: "webclient-ext-Cultivation-app-v2-content-sapb1Cultivation",
					MotherPlanner: "webclient-ext-motherplanner2-app-content-sapb1motherplanner",
					DestroyedPlants: "webclient-ext-destroy-plant-app-content-sapb1destroy-plant",
					Waste: "webclient-ext-waste-record-app-content-sapb1waste-record",
				}
			});
			jsonModel.setSizeLimit(10000);
			this.setModel(jsonModel, "jsonModel");
			// update browser title
			this.getRouter().attachTitleChanged(function (oEvent) {
				var sTitle = oEvent.getParameter("title");
				document.addEventListener('DOMContentLoaded', function () {
					document.title = sTitle;
				});
			});
			this.addChangeLog();
		},

		//session timeout by susmita
		getSessionTimeOut: function () {
			var fiveMinutesLater = new Date();
			var scs = fiveMinutesLater.setMinutes(fiveMinutesLater.getMinutes() + 1);
			var countdowntime = scs;
			var that = this;
			var x = setInterval(function () {
				var now = new Date().getTime();
				var cTime = countdowntime - now;
				if (cTime < 0) {
					that._getDialog().open();
					clearInterval(x);
				}
			});
		},
		onClose: function () {
			this._getDialog().close();
			//this.getSessionTimeOut();
			clearInterval();
		},
		onSubmit: function () {
			this.getRouter().navTo("dashBoard");
			this._getDialog().close();
			//this.getSessionTimeOut();
			clearInterval();
		},
		_getDialog: function () {
			if (!this.dialog) {
				//this.dialog = sap.ui.xmlfragment("login.view.otp", this);
				this.dialog = sap.ui.xmlfragment("sessionDialog", "com.9b.traceability.view.fragments.SessionTimeoutDialog", this);
			}
			return this.dialog;
		},
		// onSessionPress: function () {
		// 	if (!this.sessionDialog) {
		// 		this.sessionDialog = sap.ui.xmlfragment("sessionDialog", "com.9b.itemGroup.view.fragments.SessionTimeoutDialog", this);
		// 		this.getView().addDependent(this.sessionDialog);
		// 	}
		// 	this.sessionDialog.open();
		// },

		getHelper: function (oFCL) {
			//	var oFCL = this.getRootControl().byId("layout"),
			var oParams = jQuery.sap.getUriParameters(),
				oSettings = {
					defaultTwoColumnLayoutType: sap.f.LayoutType.TwoColumnsMidExpanded,
					mode: oParams.get("mode"),
					initialColumnsCount: oParams.get("initial"),
					maxColumnsCount: oParams.get("max")
				};

			return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
		},
		getContentDensityClass: function () {
			/*	if (this._sContentDensityClass === undefined) {
					// check whether FLP has already set the content density class; do nothing in this case
					if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
						this._sContentDensityClass = "";
					} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
						this._sContentDensityClass = "sapUiSizeCompact";
					} else {
						// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
						this._sContentDensityClass = "sapUiSizeCozy";
					}
				}*/
			this._sContentDensityClass = "sapUiSizeCompact";
			return this._sContentDensityClass;
		},
		addChangeLog: function () {
			var that = this;
			$(document).bind("keydown", function (oEvt) {
				if (oEvt.altKey && oEvt.keyCode === 73) {
					var bugs = that.getModel("releaseLog").getProperty("/bugs");
					var list = new sap.m.VBox();
					$.each(bugs, function (i, text) {
						var link = new sap.m.Link({
							text: text,
							press: function (evt) {
								sap.m.URLHelper.redirect(evt.getSource().getText(), true);
							}
						});
						list.addItem(link);
					});
					/*var logDialog = new LogDialog({
						fileData: list,
					});*/
					// Just open a dialog that contains this information.
					var sampleDialog = new sap.m.Dialog({
						title: "Trello Log",
						content: list,
						endButton: new sap.m.Button({
							press: function (oEvent) {
								sampleDialog.close();
							},
							text: "Ok"
						}),
						afterClose: function (oEvent1) {
							sampleDialog.destroy();
						}
					}).addStyleClass("sapUiResponsiveContentPadding");
					sampleDialog.open();

				}
			});
		}
	});
});