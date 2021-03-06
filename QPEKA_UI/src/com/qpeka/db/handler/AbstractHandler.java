package com.qpeka.db.handler;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Blob;
import java.sql.Clob;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;

import com.qpeka.db.exceptions.QpekaException;

/**
 * Generic Base class for DAO classes.
 */
public abstract class AbstractHandler {

	public byte[] getBlobColumn(ResultSet rs, int columnIndex)
			throws SQLException {
		try {
			Blob blob = rs.getBlob(columnIndex);
			if (blob == null) {
				return null;
			}

			InputStream is = blob.getBinaryStream();
			ByteArrayOutputStream bos = new ByteArrayOutputStream();

			if (is == null) {
				return null;
			} else {
				byte buffer[] = new byte[64];
				int c = is.read(buffer);
				while (c > 0) {
					bos.write(buffer, 0, c);
					c = is.read(buffer);
				}
				return bos.toByteArray();
			}
		} catch (IOException e) {
			throw new SQLException(
					"Failed to read BLOB column due to IOException: "
							+ e.getMessage());
		}
	}

	public void setBlobColumn(PreparedStatement stmt, int parameterIndex,
			byte[] value) throws SQLException {
		if (value == null) {
			stmt.setNull(parameterIndex, Types.BLOB);
		} else {
			stmt.setBinaryStream(parameterIndex,
					new ByteArrayInputStream(value), value.length);
		}
	}

	public String getClobColumn(ResultSet rs, int columnIndex)
			throws SQLException {
		try {
			Clob clob = rs.getClob(columnIndex);
			if (clob == null) {
				return null;
			}

			StringBuffer ret = new StringBuffer();
			InputStream is = clob.getAsciiStream();

			if (is == null) {
				return null;
			} else {
				byte buffer[] = new byte[64];
				int c = is.read(buffer);
				while (c > 0) {
					ret.append(new String(buffer, 0, c));
					c = is.read(buffer);
				}
				return ret.toString();
			}
		} catch (IOException e) {
			throw new SQLException(
					"Failed to read CLOB column due to IOException: "
							+ e.getMessage());
		}
	}

	public void setClobColumn(PreparedStatement stmt, int parameterIndex,
			String value) throws SQLException {
		if (value == null) {
			stmt.setNull(parameterIndex, Types.CLOB);
		} else {
			stmt.setAsciiStream(parameterIndex,
					new ByteArrayInputStream(value.getBytes()), value.length());
		}
	}
	
	public abstract List<?> findByDynamicWhere(String sql, List<Object> sqlParams)
			throws QpekaException;
	

}
