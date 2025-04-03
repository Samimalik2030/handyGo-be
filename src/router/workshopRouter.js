const express = require("express");
const { pool } = require("../db");
const workshopRouter = express.Router();
workshopRouter.post("/workshops", async (req, res, next) => {
  try {
    const {
      user_id,
      workshop_name,
      workshop_type,
      contact_number,
      logo,
      city,
      complete_address,
      selected_services,
      spare_parts_availability,
      service_mode,
      working_days,
      opening_time,
      closing_time,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO workshops 
          (user_id, workshop_name, workshop_type, contact_number, logo, city, complete_address, selected_services, 
          spare_parts_availability, service_mode, working_days, opening_time, closing_time, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        user_id,
        workshop_name,
        workshop_type,
        contact_number,
        logo,
        city,
        complete_address,
        selected_services.join(","),
        spare_parts_availability,
        service_mode,
        working_days.join(","),
        opening_time,
        closing_time,
      ]
    );

    const workshopId = result.insertId;

    const [newWorkshop] = await pool.query(
      "SELECT * FROM workshops WHERE id = ?",
      [workshopId]
    );

    res.status(201).json({
      message: "Workshop created successfully",
      workshop: newWorkshop[0],
    });
  } catch (error) {
    console.error("Database Error:", error);
    next(error);
  }
});

workshopRouter.get("/workshops", async (req, res, next) => {
  try {
    const { name, city, address } = req.query;
    let query = "SELECT * FROM workshops WHERE 1=1";
    let queryParams = [];
    if (name) {
      query += " AND workshop_name LIKE ?";
      queryParams.push(`%${name}%`);
    }
    if (city) {
      query += " AND city = ?";
      queryParams.push(city);
    }
    if (address) {
      query += " AND complete_address LIKE ?";
      queryParams.push(`%${address}%`);
    }
    const [workshops] = await pool.query(query, queryParams);
    res.status(200).json(workshops);
  } catch (error) {
    console.error("Database Error:", error);
    next(error);
  }
});

workshopRouter.get("/workshops/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [workshop] = await pool.query(
      "SELECT * FROM workshops WHERE id = ?",
      [id]
    );

    if (workshop.length === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    res.status(200).json(workshop[0]);
  } catch (error) {
    console.error("Database Error:", error);
    next(error);
  }
});
workshopRouter.patch("/workshops/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      workshop_name,
      workshop_type,
      contact_number,
      logo,
      city,
      complete_address,
      selected_services,
      spare_parts_availability,
      service_mode,
      working_days,
      opening_time,
      closing_time,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE workshops SET 
          workshop_name = ?, workshop_type = ?, contact_number = ?, logo = ?, city = ?, complete_address = ?, 
          selected_services = ?, spare_parts_availability = ?, service_mode = ?, working_days = ?, 
          opening_time = ?, closing_time = ?, updated_at = NOW() 
         WHERE id = ?`,
      [
        workshop_name,
        workshop_type,
        contact_number,
        logo,
        city,
        complete_address,
        selected_services.join(","),
        spare_parts_availability,
        service_mode,
        working_days.join(","),
        opening_time,
        closing_time,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    const [updatedWorkshop] = await pool.query(
      "SELECT * FROM workshops WHERE id = ?",
      [id]
    );

    res.status(200).json({
      message: "Workshop updated successfully",
      workshop: updatedWorkshop[0],
    });
  } catch (error) {
    console.error("Database Error:", error);
    next(error);
  }
});

workshopRouter.delete("/workshops/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM workshops WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    res.status(200).json({ message: "Workshop deleted successfully" });
  } catch (error) {
    console.error("Database Error:", error);
    next(error);
  }
});

workshopRouter.put("/workshops/:id/status", async (req, res, next) => {
  try {
    const { id } = req.params; // Get the workshop id from URL parameters
    const { status } = req.body; // Get the status from request body

    // Check if status is provided and valid
    const validStatuses = ["active", "inactive", "pending"]; // List of valid statuses
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Update the status of the workshop
    const [result] = await pool.query(
      "UPDATE workshops SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, id]
    );

    // Check if the workshop was found and updated
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    res.status(200).json({ message: "Workshop status updated successfully" });
  } catch (error) {
    console.error("Database Error:", error);
    next(error);
  }
});

module.exports = workshopRouter;
