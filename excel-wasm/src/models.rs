use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExcelReport {
    pub header: Option<HeaderComponent>,

    pub footer: Option<FooterComponent>,

    pub content: Vec<Component>,

    #[serde(rename = "_datasets")]
    pub datasets: HashMap<String, Vec<Value>>,

    #[serde(rename = "_variables")]
    pub variables: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HeaderComponent {
    pub title: String,

    pub company_name: String,

    pub document: String,

    pub logo_base64: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FooterComponent {
    pub text: Option<String>,
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
    pub table_header: Vec<TableColumn>,

    pub widths: Option<Vec<Value>>,

    pub grouping: Option<GroupingConfig>,

    pub items: Option<TableItemsConfig>,

    #[serde(rename = "summaryBox")]
    pub summary_box: Option<SummaryBox>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableItemsConfig {
    pub path: String,

    #[serde(rename = "tableHeader")]
    pub table_header: Vec<TableColumn>,

    pub widths: Option<Vec<Value>>,

    pub items: Option<Box<TableItemsConfig>>,
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
pub struct TableColumn {
    pub key: String,

    pub prefix: String,

    pub align: Option<String>,

    pub mask: Option<String>,

    pub sum: Option<bool>,
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

    #[serde(rename = "dividerBefore")]
    pub divider_before: Option<bool>,
}



