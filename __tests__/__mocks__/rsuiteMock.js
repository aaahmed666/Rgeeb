const React = require("react");
module.exports = {
  DateRangePicker: ({ onChange, value, placeholder }) =>
    React.createElement("div", { "data-testid": "date-range-picker", "data-placeholder": placeholder }),
};
module.exports.default = module.exports.DateRangePicker;
