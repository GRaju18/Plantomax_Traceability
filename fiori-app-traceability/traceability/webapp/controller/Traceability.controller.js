sap.ui.define([
	"com/9b/traceability/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/9b/traceability/model/models"

], function (BaseController, Fragment, Filter, FilterOperator, model) {
	"use strict";

	return BaseController.extend("com.9b.traceability.controller.DestroyedPlants", {
		formatter: model,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 */
		onInit: function () {
			this.getOwnerComponent().getRouter(this).attachRoutePatternMatched(this._objectMatched, this);
		},
		/** Method Called when we call routing and navigate to plants page.*/
		_objectMatched: function (oEvent) {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			if (oEvent.getParameter("name") === "traceability") {
				sap.ui.core.BusyIndicator.hide();
				this.getView().byId("traceabilityTable").clearSelection();
				//this.loadLicenseData();
				this.byId("searchFieldTable")._bUseDialog = false;
				this.loadMasterData();
			}
		},

		/** Method Called when we call oData service and store the data in model and bing the data to master plant table.*/
		loadMasterData: function () {
			this.clearAllFilters();
			var that = this;
			this.getView().setBusy(true);
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var orderBy = "?$orderby=CreateDate desc,CreateTime desc";
			this.readServiecLayer("/b1s/v2/TRACE" + orderBy, function (data) {
				$.each(data.value, function (i, e) {
					if (e.CreateDate) {
						var cDate1 = e.CreateDate;
						var cDateValue = cDate1.split("-");
						e.CreateDate = cDateValue[0] + "-" + cDateValue[1] + "-" + cDateValue[2].split("T")[0];
					}
				});
				var cDate = new Date();
				var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "KK:mm:ss a"
				});
				var refreshText = dateFormat.format(cDate);
				jsonModel.setProperty("/refreshText", "Last Updated " + refreshText);
				jsonModel.setProperty("/refreshState", "Success");

				that.byId("tableHeader").setText("Items (" + data.value.length + ")");
				jsonModel.setProperty("/destroyedPlantsData", data.value);
				that.getView().setBusy(false);
			});
		},

		/** Method for clear all filters**/
		clearAllFilters: function () {
			var filterTable = this.getView().byId("traceabilityTable");
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var aColumns = filterTable.getColumns();
			for (var i = 0; i <= aColumns.length; i++) {
				filterTable.filter(aColumns[i], null);
				filterTable.sort(aColumns[i], null);
			}
			this.byId("searchFieldTable").removeAllTokens();
		},
		onChanageNavigate: function () {
			var jsonModel = this.getOwnerComponent().getModel("jsonModel");
			var serLayerTargetUrl = jsonModel.getProperty("/target");
			var pageTo = this.byId("navigate").getSelectedKey();
			var AppNavigator;
			if (pageTo === "Strain") {
				AppNavigator = serLayerTargetUrl.Strain;
			}
			if (pageTo === "PhenoTrack") {
				AppNavigator = serLayerTargetUrl.PhenoTrack;
			}
			if (pageTo === "MicroPropagation") {
				AppNavigator = serLayerTargetUrl.MicroPropagation;
			}
			if (pageTo === "MacroPropagation") {
				AppNavigator = serLayerTargetUrl.MacroPropagation;
			}
			if (pageTo === "MotherPlanner") {
				AppNavigator = serLayerTargetUrl.MotherPlanner;
			}
			if (pageTo === "Cultivation") {
				AppNavigator = serLayerTargetUrl.Cultivation;
			}
			if (pageTo === "DestroyedPlants") {
				AppNavigator = serLayerTargetUrl.DestroyedPlants;
			}
			if (pageTo === "Waste") {
				AppNavigator = serLayerTargetUrl.Waste;
			}
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); // get a handle on the global XAppNav service
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: AppNavigator
				}
			});
		},
		onRefresh: function () {
			this.clearAllFilters();
			var cloneTable = this.byId("traceabilityTable");
			cloneTable.getBinding("rows").filter([]);
			this.byId("searchFieldTable").removeAllTokens();
			this.loadMasterData();
		},
		/*Methods for multiInput for sarch field for scan functionality start*/
		fillFilterLoad: function (elementC, removedText) { //changed by susmita for filter
			var orFilter = [];
			var andFilter = [];
			$.each(elementC.getTokens(), function (i, info) {
				var value = info.getText();
				if (value !== removedText) {
					orFilter.push(new sap.ui.model.Filter("U_PlantID", "Contains", value.toLowerCase())); //plant id
					orFilter.push(new sap.ui.model.Filter("U_BatchId", "Contains", value.toLowerCase())); //plant batch
					andFilter.push(new sap.ui.model.Filter({
						filters: orFilter,
						and: false,
						caseSensitive: false
					}));
				}
			});
			this.byId("traceabilityTable").getBinding("rows").filter(andFilter);
		},

		/** Method used to call function for export to excel for plant table.*/
		handleExportToExcel: function () {
			var deviceModel = this.getView().getModel("device");
			var isPhone = deviceModel.getProperty("/system/phone");
			var exportData = [];
			var that = this;
			var table = this.getView().byId("traceabilityTable");
			if (table.getSelectedIndices().length > 0) {
				$.each(table.getSelectedIndices(), function (i, e) {
					var obj = table.getContextByIndex(e).getObject();
					var expData = {
						DestroyedDate: obj.U_NCRDT,
						PlantTag: obj.U_NPLID,
						PlantBatch: obj.U_NPBID,
						WasteWeight: obj.U_NWTWT,
						WasteUOM: obj.U_NWTUM,
						Reason: obj.U_NDTRS,
						Note: obj.U_NNOTE,
						BagLabel: obj.U_NWTLB,
					};
					exportData.push(expData);
				});
			} else {
				sap.m.MessageToast.show("Please select atleast one item");
				return;
			}

			//Plants Report
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-dd-HH:mm:ss"
			});
			var dateStr = dateFormat.format(new Date());
			var ShowLabel = "Destroyed Plants";
			var ReportTitle = ShowLabel + dateStr;
			this.exportToExcel(exportData, ReportTitle, ShowLabel);
		},

	});
});