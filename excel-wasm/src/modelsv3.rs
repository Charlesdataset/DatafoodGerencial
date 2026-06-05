use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExcelReport {
    pub config: Option<ExcelConfig>,
    pub header: Option<HeaderComponent>,
    pub footer: Option<FooterComponent>,
    pub content: Vec<Component>,
    #[serde(rename = "_datasets")]
    pub datasets: HashMap<String, Vec<Value>>,
    #[serde(rename = "_variables")]
    pub variables: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FooterComponent {
    pub site: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExcelConfig {
    #[serde(rename = "primaryColor")]
    pub primary_color: Option<String>,
    #[serde(rename = "rowHeight")]
    pub row_height: Option<u8>,
    #[serde(rename = "headerBackground")]
    pub header_background: Option<String>,
    #[serde(rename = "headerForeground")]
    pub header_foreground: Option<String>,
    #[serde(rename = "zebraBackground")]
    pub zebra_background: Option<String>,
    #[serde(rename = "zebraForeground")]
    pub zebra_foreground: Option<String>,
    #[serde(rename = "rowBackground")]
    pub row_background: Option<String>,
    #[serde(rename = "rowForeground")]
    pub row_foreground: Option<String>,
    #[serde(rename = "borderStyle")]
    pub border_style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HeaderComponent {
    pub title: String,
    #[serde(rename = "companyName")]
    pub company_name: String,
    #[serde(rename = "logoBase64")]
    pub logo_base64: Option<String>,

    #[serde(default)]
    pub filters: Option<Vec<FilterItem>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FilterItem {
    pub key: String,
    pub value: String,

    #[serde(default)]
    pub mask: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Component {
    #[serde(rename = "table")]
    Table(TableComponent),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableComponent {
    #[serde(rename = "datasetName")]
    pub dataset_name: String,

    #[serde(rename = "tableHeader")]
    pub table_header: Vec<ExcelTableColumn>,
    pub grouping: Option<GroupingConfig>,
    #[serde(rename = "summaryBox")]
    pub summary_box: Option<SummaryBox>,
    pub childrens: Option<Vec<ChildremTable>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChildremTable {
    pub path: String,
    #[serde(rename = "tableHeader")]
    pub table_header: Vec<ExcelTableColumn>,
    pub grouping: Option<GroupingConfig>,
    pub pre_header: Option<String>,
    #[serde(rename = "marginTop")]
    pub margin_top: Option<u8>,
    #[serde(rename = "marginBottom")]
    pub margin_bottom: Option<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExcelTableColumn {
    pub key: String,
    pub cols: [u8; 2],
    pub prefix: String,

    pub align: Option<String>,
    #[serde(rename = "headerAlign")]
    pub header_align: Option<String>,

    pub mask: Option<String>,

    pub sum: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GroupingConfig {
    #[serde(rename = "groupBy")]
    pub group_by: String,

    #[serde(rename = "groupHeaderMask")]
    pub group_header_mask: Option<String>,

    pub subtotal: Option<bool>,

    pub gap: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SummaryBox {
    pub rows: Vec<SummaryRow>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SummaryRow {
    pub key: String,

    pub label: String,

    pub mask: Option<String>,

    pub bold: Option<bool>,
}
