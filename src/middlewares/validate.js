// src/middlewares/validate.js
const validate =
  (schema, validateOver = "body", paramSchemaArray = null) =>
  (req, res, next) => {
    const obj = req[validateOver];

    if (paramSchemaArray) {
      const { paramKey, paramValue, schemaKey } = paramSchemaArray;
      const param = req.params?.[paramKey];
      let schemaKeyRule = schema.extract(schemaKey);

      if (param === paramValue) schemaKeyRule = schemaKeyRule.required();
      else schemaKeyRule = schemaKeyRule.optional();

      schema = schema.keys({
        [schemaKey]: schemaKeyRule,
      });
    }
console.log("Schema received:", schema);
    const { error } = schema.validate(obj, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        message: detail.message,
        field: detail.context.key,
      }));

      return res.status(400).json({ message: error.message, status: false });
    }
    next();
  };

module.exports = {validate};
