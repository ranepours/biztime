const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

let router = new express.Router();

// GET /invoices => get all invoices
router.get("/", async (req,res,next) => {
    try{
        const result = await db.query(`SELECT id, comp_code FROM invoices ORDER BY id`);
        return res.json({"invoices": result.rows});
    }catch(err){
        return next(err);
    }
})
// GET /invoices/[id] => get details on ONE invoice
router.get("/:id", async (req,res,next) => {
    try{
        let id = req.params.id;
        const result = await db.query(
            `SELECT i.id, i.comp_code, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description FROM invoices as i INNER JOIN companies AS c ON (i.comp_code = c.code) WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0){
            throw new ExpressError(`Invoice ${id} not found.`, 404);
        }

        const data = result.rows[0];
        const invoice = {
            id: data.id,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description
            },
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date
        };

        return res.json({"invoice": invoice})
    }catch(err){
        return next(err);
    }
})
// POST /invoices => add invoice
router.post("/", async (req,res,next) => {
    try{
        let { comp_code, amt } = req.body;

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`
            [comp_code, amt]
        );
        return res.json({"invoice": result.rows[0]});
    }catch(err){
        return next(err);
    }
})
// PUT /invoices/[id] => update one
router.put("/:id", async (req,res,next) => {
    try{
        let {amt,paid} = req.body;
        let id = req.params.id;
        let paidDate = null;

        const curr = await db.query(
            `SELECT paid FROM invoices WHERE id=$1`, [id]
        );
        if(curr.rows.length === 0){
            throw new ExpressError(`Invoice ${id} not found.`, 404);
        }
        
        const payDate = curr.rows[0].paid_date;
        if(!payDate && paid){
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = payDate;
        }

        const result = await db.query(
            `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
            [amt, paid, paidDate, id]
        );

        return res.json({"invoice": result.rows[0]})
    }catch(err){
        return next(err);
    }
})
// DELETE /invoices/[id] => delete one
router.delete("/:id", async (req,res,next) => {
    try{
        let id = req.params.id;
        const result = await db.query(
            `DELETE FROM invoices WHERE id=$1 RETURNING id`, [id]
        );

        if (result.rows.length === 0){
            throw new ExpressError(`Invoice ${id} not found.`, 404);
        } return res.json({"status": "deleted"});
    }catch(err){
        return next(err);
    }
})



module.exports = router;