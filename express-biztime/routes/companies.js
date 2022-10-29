const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError");
const db = require("../db");

let router = new express.Router();

//ROUTES:
// GET /companies => list of companies
router.get("/", async (req, res, next) => {
    try {
        const result = await db.query(
            `SELECT code, name FROM companies ORDER BY name`
        );
        return res.json({"companies": result.rows})
    } catch (err) {
        return next(err);
    }
})
// GET /companie/[code] => info on specific company
router.get("/:code", async (req, res, next) => {
    try { 
        let code = req.params.code;
        const companyRes = await db.query(
            `SELECT code, name, description FROM companies WHERE code = $1`, [code]
        );
        const invoiceRes = await db.query(
            `SELECT id, FROM invoices, WHERE comp_code = $1`, [code]
        );

        if (companyRes.rows.length === 0){
            throw new ExpressError(`Company ${code} not found.`, 404);
        }

        const company = companyRes.rows[0];
        const invoices = invoiceRes.rows;

        company.invoices = invoices.map(i => i.id);

        return res.json({"company": company});
    } catch (err) {
        return next(err);
    }
})
// POST /companies => add new
router.post("/", async (req,res,next) => {
    try {
        let { name, description } = req.body;
        let code = slugify(name, {lower: true});

        const result = await db.query(
            `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, 
            [code, name, description]
            );

            return res.status(201).json({"company": result.rows[0]});
    } catch (err) {
        return next(err);
    }
})
// PUT /companies/[code] => updates
router.put("/:code", async (req,res,next) => {
    try {
        let { name, description } = req.body;
        let code = req.params.code;

        const result = await db.query(
            `UPDATE cpmpanies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, 
            [name, description, code]
        );

        if (result.rows.length === 0){
            throw new ExpressError(`Company ${code} not found.`, 404);
        } else { 
            return res.json({"company": result.rows[0]});
        }
    } catch (err) {
        return next(err);
    }
})
// DELETE /companies/[code] => remove
router.delete("/:code", async (req,res,next) => {
    try {
        let code = req.params.code;
        const result = await db.query(
            `DELET FROM companies WHERE code=$1 RETURNING code`, [code]);
        if (result.rows.length === 0){
            throw new ExpressError(`Company ${code} not found.`, 404)
        } return res.json({"status": "deleted"});
    } catch (err) {
        return next(err);
    }
})

module.exports = router;